import { Injectable, Logger } from "@nestjs/common";
import { ChatMessageRepository } from "./chat-message.repository";
import { GeminiClient } from "./gemini.client";
import { SettingsService } from "../settings/settings.service";
import { AccountsRepository } from "../accounts/accounts.repository";
import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsService } from "../transactions/transactions.service";
import { utcToday } from "../../common/date-utils";

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly messages: ChatMessageRepository,
    private readonly gemini: GeminiClient,
    private readonly settings: SettingsService,
    private readonly accountsRepository: AccountsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly transactionsService: TransactionsService,
  ) {}

  history() {
    return this.messages.findRecent().then((rows) => rows.reverse());
  }

  clearHistory() {
    return this.messages.clear();
  }

  async chat(userMessage: string) {
    await this.messages.create("user", userMessage);

    const settings = await this.settings.getRaw();
    if (!settings.geminiApiKey) {
      const reply =
        "Ainda não configurei uma chave da API do Gemini. Adicione sua chave em Configurações > Assistente de IA para eu começar a lançar as coisas pra você.";
      await this.messages.create("assistant", reply);
      return { reply, needsSetup: true as const };
    }

    try {
      const [accounts, incomeCategories, expenseCategories] = await Promise.all([
        this.accountsRepository.findAll(),
        this.categoriesRepository.findAll("INCOME"),
        this.categoriesRepository.findAll("EXPENSE"),
      ]);

      const systemInstruction = buildSystemInstruction({
        accountNames: accounts.map((a) => a.name),
        incomeCategoryNames: incomeCategories.map((c) => c.name),
        expenseCategoryNames: expenseCategories.map((c) => c.name),
      });

      const intent = await this.gemini.extractIntent({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel,
        systemInstruction,
        userMessage,
      });

      if (!intent.understood || intent.action === "none" || !intent.value) {
        await this.messages.create("assistant", intent.replyMessage);
        return { reply: intent.replyMessage };
      }

      const type = intent.action === "create_income" ? "INCOME" : "EXPENSE";
      const categoryPool = type === "INCOME" ? incomeCategories : expenseCategories;
      const account = matchByName(accounts, intent.accountName) ?? accounts[0];
      const category = matchByName(categoryPool, intent.categoryName) ?? categoryPool[0];

      if (!account || !category) {
        const reply = "Você ainda não tem contas ou categorias cadastradas para eu lançar isso. Crie uma primeiro.";
        await this.messages.create("assistant", reply);
        return { reply };
      }

      const transaction = await this.transactionsService.create({
        value: intent.value,
        type,
        date: intent.date ?? utcToday().toISOString().slice(0, 10),
        dueDate: intent.dueDate,
        description: intent.description || userMessage.slice(0, 80),
        accountId: account.id,
        categoryId: category.id,
        isPaid: intent.isPaid ?? true,
        installmentTotal: intent.installments,
      } as any);

      const reply = `${intent.replyMessage} (${type === "INCOME" ? "receita" : "despesa"} de ${formatBRL(intent.value)} em ${account.name} / ${category.name})`;
      await this.messages.create("assistant", reply);
      return { reply, transaction };
    } catch (err) {
      this.logger.error(err);
      const reply =
        "Tive um problema ao falar com o Gemini agora. Confira se a chave da API está correta em Configurações e tente de novo.";
      await this.messages.create("assistant", reply);
      return { reply, error: true as const };
    }
  }
}

function buildSystemInstruction(ctx: {
  accountNames: string[];
  incomeCategoryNames: string[];
  expenseCategoryNames: string[];
}) {
  const today = utcToday().toISOString().slice(0, 10);
  return `Você é o assistente financeiro de um app de finanças pessoais em português do Brasil.
Hoje é ${today}.
Contas existentes: ${ctx.accountNames.join(", ") || "nenhuma"}.
Categorias de receita: ${ctx.incomeCategoryNames.join(", ") || "nenhuma"}.
Categorias de despesa: ${ctx.expenseCategoryNames.join(", ") || "nenhuma"}.

Sua tarefa é interpretar a mensagem do usuário e extrair um lançamento financeiro (receita ou despesa), se houver um.
Regras:
- accountName e categoryName devem ser o nome mais parecido possível dentre os existentes listados acima.
- Se o usuário não mencionar conta, escolha a mais provável ou deixe em branco.
- Datas relativas ("hoje", "ontem", "amanhã") devem virar datas absolutas YYYY-MM-DD com base em hoje.
- isPaid deve ser true se o usuário deu a entender que já pagou/recebeu, false se for algo a pagar/receber no futuro.
- Se a mensagem não for um lançamento financeiro (for uma pergunta, saudação, etc.), retorne action "none" e responda normalmente em replyMessage.
- replyMessage deve ser curta, natural e em português.`;
}

function matchByName<T extends { name: string }>(list: T[], name?: string): T | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === normalized) ??
    list.find((item) => item.name.toLowerCase().includes(normalized) || normalized.includes(item.name.toLowerCase()))
  );
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
