import { db } from '../db/schema';
import { RecurringRepository, TransactionRepository } from '../db/repositories';
import type { Transaction } from '../domain/types';

export const RecurringService = {
  generateForMonth: async (year: number, month: number) => {
    const rules = await RecurringRepository.getAll();
    const activeRules = rules.filter(r => r.active);
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    let generatedCount = 0;

    for (const rule of activeRules) {
      if (rule.lastGeneratedFor === monthStr) continue;

      const txDate = `${monthStr}-${String(rule.dayOfMonth).padStart(2, '0')}`;
      const newTx: Omit<Transaction, 'id'> = {
        date: txDate,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        description: `[RECORRENTE] ${rule.description || ''}`.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await TransactionRepository.add(newTx as any);
      await RecurringRepository.update(rule.id!, { lastGeneratedFor: monthStr });
      generatedCount++;
    }

    return generatedCount;
  }
};
