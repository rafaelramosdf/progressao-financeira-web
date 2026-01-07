export interface Category {
  id?: string;
  name: string;
  color: string;
  icon?: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id?: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number; // in cents
  categoryId: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id?: string;
  year: number;
  month: number; // 0-11
  categoryId: string;
  amount: number; // in cents
}

export interface RecurringRule {
  id?: string;
  type: TransactionType;
  amount: number; // in cents
  categoryId: string;
  description?: string;
  dayOfMonth: number; // 1-31
  active: boolean;
  lastGeneratedFor?: string; // YYYY-MM
}

export interface MonthlySummary {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  previousBalance: number;
  variation: number; // percentage
  topCategories: Array<{
    categoryId: string;
    amount: number;
    percentage: number;
  }>;
}
