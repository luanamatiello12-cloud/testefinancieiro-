import { Injectable, Logger } from "@nestjs/common";
import { ChatMessageRepository } from "./chat-message.repository";
import { GeminiClient, FunctionDeclaration, GeminiTurn } from "./gemini.client";
import { SettingsService } from "../settings/settings.service";
import { AccountsRepository } from "../accounts/accounts.repository";
import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsService } from "../transactions/transactions.service";
import { AgendaService } from "../agenda/agenda.service";
import { ClientsService } from "../clients/clients.service";
import { DashboardService } from "../dashboard/dashboard.service";
import { utcToday } from "../../common/date-utils";

const MAX_TOOL_ROUNDS = 5;

const TOOLS: FunctionDeclaration[] = [
  {
    name: "criar_lancamento",
    description:
      "Cria uma receita ou despesa (lançamento financeiro). Use para pedidos como 'gastei X', 'recebi X', 'tenho que pagar X' ou 'vou receber X'.",
    parameters: {
      type: "OBJECT",
      properties: {
        tipo: { type: "STRING", enum: ["RECEITA", "DESPESA"] },
        valor: { type: "NUMBER" },
        descricao: { type: "STRING" },
        data: { type: "STRING", description: "Data do lançamento, YYYY-MM-DD" },
        vencimento: { type: "STRING", description: "Data de vencimento (YYYY-MM-DD), se ainda não foi pago/recebido" },
        pago: { type: "BOOLEAN", description: "true se já foi pago/recebido, false se é uma conta a pagar/receber" },
        nomeConta: { type: "STRING", description: "Nome da conta mais parecido com o que o usuário mencionou" },
        nomeCategoria: { type: "STRING", description: "Nome da categoria mais parecida com o que o usuário mencionou" },
      },
      required: ["tipo", "valor", "descricao", "data"],
    },
  },
  {
    name: "criar_evento_agenda",
    description:
      "Cria um lembrete/evento na agenda SEM valor financeiro (ex: reunião, compromisso, ligação). Não use para contas a pagar/receber — nesse caso use criar_lancamento.",
    parameters: {
      type: "OBJECT",
      properties: {
        titulo: { type: "STRING" },
        data: { type: "STRING", description: "YYYY-MM-DD" },
      },
      required: ["titulo", "data"],
    },
  },
  {
    name: "listar_clientes",
    description: "Lista os clientes cadastrados no sistema, do mais recente para o mais antigo.",
    parameters: {
      type: "OBJECT",
      properties: {
        limite: { type: "INTEGER", description: "Quantos clientes retornar, padrão 10" },
      },
    },
  },
  {
    name: "listar_lancamentos_recentes",
    description: "Lista lançamentos (receitas/despesas) recentes, com filtros opcionais.",
    parameters: {
      type: "OBJECT",
      properties: {
        limite: { type: "INTEGER", description: "Quantos retornar, padrão 10" },
        tipo: { type: "STRING", enum: ["RECEITA", "DESPESA"] },
        apenasPendentes: { type: "BOOLEAN", description: "Se true, retorna só os que ainda não foram pagos/recebidos" },
      },
    },
  },
  {
    name: "resumo_financeiro",
    description: "Retorna o resumo financeiro do mês atual: saldo total, receitas, despesas e lucro do mês.",
  },
  {
    name: "saldo_contas",
    description: "Retorna o saldo atual de cada conta cadastrada.",
  },
  {
    name: "vendas_pendentes",
    description: "Lista trabalhos de clientes (vendas) com pagamento pendente a receber ou terceirização pendente a pagar.",
  },
];

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
    private readonly clientsService: ClientsService,
    private readonly dashboardService: DashboardService,
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
        "Ainda não configurei uma chave da API do Gemini. Adicione sua chave em Configurações > Assistente de IA para eu começar a te ajudar.";
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

      const contents: GeminiTurn[] = [{ role: "user", parts: [{ text: userMessage }] }];
      let lastAction: { name: string; result: unknown } | undefined;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const result = await this.gemini.chat({
          apiKey: settings.geminiApiKey,
          model: settings.geminiModel,
          systemInstruction,
          contents,
          tools: TOOLS,
        });

        if (result.functionCalls.length === 0) {
          const reply = result.text || "Certo!";
          await this.messages.create("assistant", reply);
          return { reply, ...(lastAction ? { action: lastAction.name, result: lastAction.result } : {}) };
        }

        contents.push(result.modelTurn);

        const responseParts: GeminiTurn["parts"] = [];
        for (const call of result.functionCalls) {
          const toolResult = await this.executeTool(call.name, call.args, {
            accounts,
            incomeCategories,
            expenseCategories,
          });
          lastAction = { name: call.name, result: toolResult };
          responseParts.push({ functionResponse: { name: call.name, response: toolResult as Record<string, unknown> } });
        }
        contents.push({ role: "function", parts: responseParts });
      }

      const reply = "Não consegui concluir isso agora — pode tentar de um jeito mais direto?";
      await this.messages.create("assistant", reply);
      return { reply };
    } catch (err) {
      this.logger.error(err);
      const reply =
        "Tive um problema ao falar com o Gemini agora. Confira se a chave da API está correta em Configurações e tente de novo.";
      await this.messages.create("assistant", reply);
      return { reply, error: true as const };
    }
  }

  private async executeTool(
    name: string,
    args: Record<string, unknown>,
    ctx: { accounts: { id: string; name: string }[]; incomeCategories: { id: string; name: string }[]; expenseCategories: { id: string; name: string }[] },
  ): Promise<unknown> {
    try {
      switch (name) {
        case "criar_lancamento":
          return await this.toolCreateTransaction(args, ctx);
        case "criar_evento_agenda":
          return await this.toolCreateEvent(args);
        case "listar_clientes":
          return await this.toolListClients(args);
        case "listar_lancamentos_recentes":
          return await this.toolListTransactions(args);
        case "resumo_financeiro":
          return await this.dashboardService.summary();
        case "saldo_contas":
          return ctx.accounts.length === 0
            ? { contas: [] }
            : { contas: ctx.accounts.map((a: any) => ({ nome: a.name, saldo: a.currentBalance })) };
        case "vendas_pendentes":
          return await this.toolPendingSales();
        default:
          return { erro: `Ferramenta desconhecida: ${name}` };
      }
    } catch (err) {
      this.logger.error(`Erro executando ferramenta ${name}`, err as Error);
      return { erro: "Falha ao executar essa ação. Tente descrever de outra forma." };
    }
  }

  private async toolCreateTransaction(
    args: Record<string, unknown>,
    ctx: { accounts: { id: string; name: string }[]; incomeCategories: { id: string; name: string }[]; expenseCategories: { id: string; name: string }[] },
  ) {
    const tipo = String(args.tipo ?? "").toUpperCase();
    const type = tipo === "RECEITA" ? "INCOME" : "EXPENSE";
    const categoryPool = type === "INCOME" ? ctx.incomeCategories : ctx.expenseCategories;
    const account = matchByName(ctx.accounts, args.nomeConta as string | undefined) ?? ctx.accounts[0];
    const category = matchByName(categoryPool, args.nomeCategoria as string | undefined) ?? categoryPool[0];

    if (!account || !category) {
      return { erro: "Não há contas ou categorias cadastradas para lançar isso." };
    }

    const value = Number(args.valor);
    if (!value || value <= 0) {
      return { erro: "Valor inválido." };
    }

    const transaction = await this.transactionsService.create({
      value,
      type,
      date: (args.data as string) ?? utcToday().toISOString().slice(0, 10),
      dueDate: args.vencimento as string | undefined,
      description: (args.descricao as string) || "Lançamento via assistente",
      accountId: account.id,
      categoryId: category.id,
      isPaid: args.pago === undefined ? true : Boolean(args.pago),
    } as any);

    return {
      sucesso: true,
      tipo,
      valor: value,
      conta: account.name,
      categoria: category.name,
      id: (transaction as any).id,
    };
  }

  private async toolCreateEvent(args: Record<string, unknown>) {
    const titulo = String(args.titulo ?? "").trim();
    const data = args.data as string | undefined;
    if (!titulo || !data) {
      return { erro: "Preciso de um título e uma data para criar o evento." };
    }
    const event = await this.agendaService.createEvent({ title: titulo, date: data });
    return { sucesso: true, titulo, data, id: event.id };
  }

  private async toolListClients(args: Record<string, unknown>) {
    const limite = Number(args.limite) > 0 ? Number(args.limite) : 10;
    const clients = await this.clientsService.findAll();
    const ordered = [...clients].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      clientes: ordered.slice(0, limite).map((c: any) => ({
        nome: c.name,
        email: c.email,
        telefone: c.phone,
        tags: c.tags?.map((t: any) => t.name) ?? [],
      })),
    };
  }

  private async toolListTransactions(args: Record<string, unknown>) {
    const limite = Number(args.limite) > 0 ? Number(args.limite) : 10;
    const tipo = args.tipo === "RECEITA" ? "INCOME" : args.tipo === "DESPESA" ? "EXPENSE" : undefined;
    const apenasPendentes = args.apenasPendentes === true;

    const all = await this.transactionsService.findAll({
      type: tipo,
      isPaid: apenasPendentes ? "false" : undefined,
    } as any);

    return {
      lancamentos: all.slice(0, limite).map((t: any) => ({
        descricao: t.description,
        valor: t.value,
        tipo: t.type === "INCOME" ? "RECEITA" : "DESPESA",
        data: t.date?.toISOString?.().slice(0, 10) ?? t.date,
        pago: t.isPaid,
        conta: t.account?.name,
        categoria: t.category?.name,
      })),
    };
  }

  private async toolPendingSales() {
    const jobs = await this.clientsService.allJobs();
    const aReceber = jobs
      .filter((j: any) => !j.incomeTransaction.isPaid)
      .map((j: any) => ({
        cliente: j.client?.name,
        descricao: j.description,
        valor: j.incomeTransaction.value,
        vencimento: j.incomeTransaction.dueDate?.toISOString?.().slice(0, 10) ?? j.incomeTransaction.dueDate,
      }));
    const aPagar = jobs
      .filter((j: any) => j.outsourcedTransaction && !j.outsourcedTransaction.isPaid)
      .map((j: any) => ({
        para: j.outsourcedTo,
        descricao: j.description,
        valor: j.outsourcedTransaction.value,
        vencimento: j.outsourcedTransaction.dueDate?.toISOString?.().slice(0, 10) ?? j.outsourcedTransaction.dueDate,
      }));
    return { a_receber: aReceber, a_pagar: aPagar };
  }
}

function buildSystemInstruction(ctx: {
  accountNames: string[];
  incomeCategoryNames: string[];
  expenseCategoryNames: string[];
}) {
  const today = utcToday().toISOString().slice(0, 10);
  return `Você é o assistente financeiro de um app de finanças pessoais e do negócio de foto/vídeo/captação do usuário, em português do Brasil.
Hoje é ${today}.
Contas existentes: ${ctx.accountNames.join(", ") || "nenhuma"}.
Categorias de receita: ${ctx.incomeCategoryNames.join(", ") || "nenhuma"}.
Categorias de despesa: ${ctx.expenseCategoryNames.join(", ") || "nenhuma"}.

Você tem ferramentas (function calling) para CONSULTAR dados reais do sistema (clientes, lançamentos, saldo, resumo financeiro, vendas pendentes) e para CRIAR lançamentos e eventos de agenda. Use essas ferramentas sempre que a pergunta do usuário depender de dados dele — nunca invente números, nomes de clientes ou valores. Se a pergunta pedir uma lista ou um número (ex: "quais meus últimos clientes", "quanto gastei esse mês", "o que tenho a receber"), chame a ferramenta correspondente antes de responder.

Sobre a Agenda: ela mostra dois tipos de coisa — (1) lançamentos com vencimento futuro (contas a pagar/receber) e faturas de cartão, e (2) eventos soltos sem valor. Se o pedido de agenda tiver um valor em dinheiro, use criar_lancamento com vencimento e pago=false. Se for um lembrete sem dinheiro envolvido, use criar_evento_agenda.

Regras para criar_lancamento:
- nomeConta e nomeCategoria devem ser o nome mais parecido possível dentre os existentes listados acima.
- Datas relativas ("hoje", "ontem", "amanhã") viram datas absolutas YYYY-MM-DD com base em hoje.
- pago=true se o usuário deu a entender que já pagou/recebeu; pago=false se for algo a pagar/receber no futuro (use vencimento nesse caso).

Depois de usar uma ferramenta, responda ao usuário em português, de forma curta e natural, resumindo o resultado (não repita dados técnicos como IDs).
Se a mensagem não precisar de nenhuma ferramenta (pergunta genérica, saudação), responda direto sem chamar nada.`;
}

function matchByName<T extends { name: string }>(list: T[], name?: string): T | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === normalized) ??
    list.find((item) => item.name.toLowerCase().includes(normalized) || normalized.includes(item.name.toLowerCase()))
  );
}
