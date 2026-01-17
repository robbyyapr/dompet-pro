
export type AccountType = 'Bank' | 'E-Wallet' | 'Cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
}

export type TransactionType = 'Income' | 'Expense' | 'Transfer';

export interface Transaction {
  id: string;
  accountId: string;
  toAccountId?: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'AI_PARSE' | 'AI_ANALYZE' | 'SYSTEM' | 'SECURITY';
  message: string;
  latency?: number;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
}

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
  logs: SystemLog[];
  isLocked: boolean;
  otpCode: string | null;
}
