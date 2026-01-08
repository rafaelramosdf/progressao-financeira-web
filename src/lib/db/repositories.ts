import { db } from "./schema";
import type {
  Category,
  Transaction,
  Budget,
  RecurringRule,
} from "../domain/types";

export const CategoryRepository = {
  getAll: () => db.categories.toArray(),
  add: (category: Category) => db.categories.add(category),
  update: (id: string, category: Partial<Category>) =>
    db.categories.update(id, category),
  delete: (id: string) => db.categories.delete(id),
  seed: async () => {
    const count = await db.categories.count();
    if (count === 0) {
      await db.categories.bulkAdd([
        { name: "Alimentação", color: "#ef4444" },
        { name: "Transporte", color: "#3b82f6" },
        { name: "Moradia", color: "#10b981" },
        { name: "Lazer", color: "#f59e0b" },
        { name: "Saúde", color: "#8b5cf6" },
        { name: "Salário", color: "#22c55e" },
      ]);
    }
  },
};

export const TransactionRepository = {
  getFiltered: (year: number, month: number) => {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

    return db.transactions
      .where("date")
      .between(startDate, endDate, true, true)
      .reverse()
      .sortBy("date");
  },
  add: (transaction: Transaction) => db.transactions.add(transaction),
  update: (id: string, transaction: Partial<Transaction>) =>
    db.transactions.update(id, transaction),
  delete: (id: string) => db.transactions.delete(id),
  getByYear: (year: number) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return db.transactions
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
  },
};

export const BudgetRepository = {
  getForMonth: (year: number, month: number) =>
    db.budgets.where({ year, month }).toArray(),
  upsert: async (budget: Budget) => {
    const existing = await db.budgets
      .where({
        year: budget.year,
        month: budget.month,
        categoryId: budget.categoryId,
      })
      .first();
    if (existing) {
      return db.budgets.update(existing.id!, { amount: budget.amount });
    }
    return db.budgets.add(budget);
  },
};

export const RecurringRepository = {
  getAll: () => db.recurringRules.toArray(),
  add: (rule: RecurringRule) => db.recurringRules.add(rule),
  update: (id: string, rule: Partial<RecurringRule>) =>
    db.recurringRules.update(id, rule),
  delete: (id: string) => db.recurringRules.delete(id),
};
