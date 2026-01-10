import { db } from '../db/schema';
import { RecurringRepository, TransactionRepository } from '../db/repositories';
import type { Transaction } from '../domain/types';

export const RecurringService = {
  generateForYear: async (year: number) => {
    const rules = await RecurringRepository.getAll();
    const activeRules = rules.filter((r) => r.active);
    const existingTransactions = await TransactionRepository.getByYear(year);

    let count = 0;

    for (let month = 0; month < 12; month++) {
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

      for (const rule of activeRules) {
        // Handle end of month dates (e.g. 31st in Feb)
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const effectiveDay = Math.min(rule.dayOfMonth, lastDayOfMonth);
        const txDate = `${monthStr}-${String(effectiveDay).padStart(2, "0")}`;
        const description = `[RECORRENTE] ${rule.description || ""}`.trim();

        // Check for duplicate/existing
        const existing = existingTransactions.find(
          (tx) =>
            tx.description === description &&
            tx.date.startsWith(monthStr) // Ensure it's in the correct month
        );

        if (existing) {
          // Update existing
          if (
            existing.amount !== rule.amount ||
            existing.categoryId !== rule.categoryId ||
            existing.type !== rule.type ||
            existing.date !== txDate
          ) {
            await TransactionRepository.update(existing.id!, {
              amount: rule.amount,
              categoryId: rule.categoryId,
              type: rule.type,
              date: txDate,
              updatedAt: Date.now(),
            });
            count++;
          }
        } else {
          // Create new
          const newTx: Omit<Transaction, "id"> = {
            date: txDate,
            type: rule.type,
            amount: rule.amount,
            categoryId: rule.categoryId,
            description,
            paid: false, // Default to unpaid until user marks it
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await TransactionRepository.add(newTx as any);
          count++;
        }
      }
    }

    return count;
  },

  deleteForYear: async (year: number, description: string) => {
    const targetDesc = `[RECORRENTE] ${description || ""}`.trim();
    const existingTransactions = await TransactionRepository.getByYear(year);

    const toDelete = existingTransactions
      .filter((tx) => tx.description === targetDesc)
      .map((tx) => tx.id!)
      .filter(Boolean);

    if (toDelete.length > 0) {
      await db.transactions.bulkDelete(toDelete);
    }

    return toDelete.length;
  },
};
