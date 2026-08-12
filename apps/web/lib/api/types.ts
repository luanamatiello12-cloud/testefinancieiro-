export type AccountType = "CHECKING" | "SAVINGS" | "CASH" | "WALLET" | "INVESTMENT" | "DIGITAL";
export type TransactionType = "INCOME" | "EXPENSE";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bank: string | null;
  color: string;
  icon: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
}

export interface Transaction {
  id: string;
  value: number;
  type: TransactionType;
  date: string;
  dueDate: string | null;
  paymentDate: string | null;
  description: string;
  note: string | null;
  isRecurring: boolean;
  isPaid: boolean;
  isFavorite: boolean;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  accountId: string;
  categoryId: string;
  account: Account;
  category: Category;
  attachments: Attachment[];
}

export interface DashboardSummary {
  saldoTotal: number;
  saldoContas: number;
  saldoCarteira: number;
  saldoInvestido: number;
  totalReceitas: number;
  totalDespesas: number;
  lucroMes: number;
}

export interface DashboardUpcoming {
  aVencer: Transaction[];
  atrasadas: Transaction[];
}

export interface DashboardCharts {
  receitaXDespesa: { month: string; receitas: number; despesas: number }[];
  gastosPorCategoria: { name: string; color: string; value: number }[];
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string | null;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  icon: string;
}

export interface CardPurchase {
  id: string;
  value: number;
  categoryId: string;
  category: Category;
  establishment: string;
  note: string | null;
  date: string;
  invoiceMonth: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

export interface CardInvoiceView {
  month: string;
  total: number;
  paid: number;
  open: number;
  purchases: CardPurchase[];
  futureInstallments: CardPurchase[];
}

export interface CardLimit {
  limit: number;
  used: number;
  available: number;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromAccount: Account;
  toAccount: Account;
  value: number;
  date: string;
  note: string | null;
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline: string | null;
  icon: string;
  color: string;
}

export type CashFlowGranularity = "day" | "week" | "month" | "year";

export interface CashFlowBucket {
  key: string;
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CashFlowData {
  granularity: CashFlowGranularity;
  referenceDate: string;
  series: CashFlowBucket[];
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
  transactions: Transaction[];
}

export type AgendaEventType = "expense_due" | "income_expected" | "card_due";

export interface AgendaEvent {
  date: string;
  type: AgendaEventType;
  title: string;
  value: number;
  entityId: string;
}

export interface AgendaData {
  month: string;
  events: AgendaEvent[];
}

export type NotificationType =
  | "DUE_SOON"
  | "OVERDUE"
  | "CARD_CLOSING"
  | "LIMIT_ALMOST_REACHED"
  | "NEGATIVE_BALANCE"
  | "GOAL_REACHED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

export interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

export interface AppSettings {
  geminiModel: string;
  hasGeminiKey: boolean;
  geminiKeyPreview: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
}

export type ServiceType = "PHOTO" | "VIDEO" | "CAPTURE";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  PHOTO: "Foto",
  VIDEO: "Vídeo",
  CAPTURE: "Captação",
};

export interface ClientJob {
  id: string;
  clientId: string;
  type: ServiceType;
  description: string;
  serviceDate: string;
  incomeTransaction: Transaction;
  isOutsourced: boolean;
  outsourcedTo: string | null;
  outsourcedTransaction: Transaction | null;
  client?: Client;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  CASH: "Caixa",
  WALLET: "Carteira",
  INVESTMENT: "Investimentos",
  DIGITAL: "Conta Digital",
};
