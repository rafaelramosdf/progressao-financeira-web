import Dexie, { type Table } from 'dexie';
import type { Category, Transaction, Budget, RecurringRule } from '../domain/types';

export class FinanceDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;
  recurringRules!: Table<RecurringRule>;

  constructor() {
    super('FinanceDB');
    this.version(2).stores({
      transactions: '++id, date, categoryId, type, paid, [date+type]',
      categories: '++id, name',
      budgets: '++id, [year+month+categoryId]',
      recurringRules: '++id, active'
    });
  }
}

export const db = new FinanceDB();
