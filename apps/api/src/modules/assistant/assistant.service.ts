import { Injectable, Logger } from "@nestjs/common";
import { ChatMessageRepository } from "./chat-message.repository";
import { GeminiClient } from "./gemini.client";
import { SettingsService } from "../settings/settings.service";
import { AccountsRepository } from "../accounts/accounts.repository";
import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsService } from "../transactions/transactions.service";
import { AgendaService } from "../agenda/agenda.service";
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
    private readonly agendaService: AgendaService,
  ) {}

  history() {
    return this.messages.findRecent().then((rows) => rows.reverse());
  }

  async listAvailableModels() {
    const settings = await this.settings.getRaw();
    if (!settings.geminiApiKey) return { models: [] };
    const models = await this.gemini.listModels(settings.geminiApiKey);
    return { models };
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

      if (!intent.understood || intent.action === "none") {
        await this.messages.create("assistant", intent.replyMessage);
        return { reply: intent.replyMessage };
      }

      if (intent.action === "create_event") {
        if (!intent.date) {
          await this.messages.create("assistant", intent.replyMessage);
          return { reply: intent.replyMessage };
        }
        const event = await this.agendaService.createEvent({
          title: intent.description || userMessage.slice(0, 80),
          date: intent.date,
        });
        const reply = `${intent.replyMessage} (evento em ${formatDateBR(intent.date)})`;
        await this.messages.create("assistant", reply);
        return { reply, event };
      }

      if (!intent.value) {
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

Sua tarefa é interpretar a mensagem do usuário e extrair um lançamento financeiro (receita ou despesa) ou um evento de agenda, se houver um.

Sobre a Agenda: a tela de Agenda mostra dois tipos de coisa juntos — (1) lançamentos com vencimento futuro (contas a pagar/receber) e faturas de cartão, e (2) eventos soltos sem valor, tipo lembretes/compromissos. Use action "create_event" quando o usuário pedir pra "colocar/adicionar algo na agenda", "lembrar de algo", "agendar algo" e NÃO houver valor em dinheiro envolvido (ex: "agenda uma reunião com o cliente dia 20", "me lembra de ligar pro contador amanhã") — nesse caso "description" é o título do evento e "date" é a data do evento (YYYY-MM-DD). Se o pedido de agenda tiver um valor em dinheiro (ex: "agenda o pagamento do aluguel, 900 reais, dia 20"), trate como create_expense/create_income normalmente, usando dueDate para a data e isPaid=false.
Se faltar a data em um pedido de agenda/evento, retorne action "create_event" mesmo assim mas sem "date", e pergunte no replyMessage a data (e o valor, se for o caso de conta a pagar/receber).

Regras:
- accountName e categoryName devem ser o nome mais parecido possível dentre os existentes listados acima (só se aplica a create_income/create_expense).
- Se o usuário não mencionar conta, escolha a mais provável ou deixe em branco.
- Datas relativas ("hoje", "ontem", "amanhã") devem virar datas absolutas YYYY-MM-DD com base em hoje.
- isPaid deve ser true se o usuário deu a entender que já pagou/recebeu, false se for algo a pagar/receber no futuro (nesse caso use dueDate para a data de vencimento).
- Se a mensagem não for um lançamento financeiro nem um pedido de agenda/evento (for uma pergunta, saudação, etc.), retorne action "none" e responda normalmente em replyMessage.
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

function formatDateBR(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(isoDate),
  );
}
