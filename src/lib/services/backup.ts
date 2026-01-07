import { db } from '../db/schema';
import { CategoryRepository } from '../db/repositories';

export const BackupService = {
  exportData: async () => {
    const data = {
      transactions: await db.transactions.toArray(),
      categories: await db.categories.toArray(),
      budgets: await db.budgets.toArray(),
      recurringRules: await db.recurringRules.toArray(),
      exportedAt: new Date().toISOString(),
      version: 1
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: async (jsonFile: File) => {
    const text = await jsonFile.text();
    const data = JSON.parse(text);

    if (!data.categories || !data.transactions) {
      throw new Error('Formato de arquivo inválido.');
    }

    await db.transaction('rw', [db.categories, db.transactions, db.budgets, db.recurringRules], async () => {
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurringRules.clear();

      await db.categories.bulkAdd(data.categories);
      await db.transactions.bulkAdd(data.transactions);
      await db.budgets.bulkAdd(data.budgets || []);
      await db.recurringRules.bulkAdd(data.recurringRules || []);
    });
  },

  resetAll: async () => {
    await db.transaction('rw', [db.categories, db.transactions, db.budgets, db.recurringRules], async () => {
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.recurringRules.clear();
      await CategoryRepository.seed();
    });
  }
};
