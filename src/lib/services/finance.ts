import type { Transaction, MonthlySummary } from '../domain/types';
import { TransactionRepository } from '../db/repositories';

export const FinanceService = {
  getMonthlySummary: async (year: number, month: number): Promise<MonthlySummary> => {
    const transactions = await TransactionRepository.getFiltered(year, month);
    
    // Get previous month for variation
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevTransactions = await TransactionRepository.getFiltered(prevYear, prevMonth);
    
    const summary = transactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.totalIncomes += tx.amount;
      else acc.totalExpenses += tx.amount;
      return acc;
    }, { totalIncomes: 0, totalExpenses: 0 });

    const prevSummary = prevTransactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.totalIncomes += tx.amount;
      else acc.totalExpenses += tx.amount;
      return acc;
    }, { totalIncomes: 0, totalExpenses: 0 });

    const balance = summary.totalIncomes - summary.totalExpenses;
    const prevBalance = prevSummary.totalIncomes - prevSummary.totalExpenses;
    
    let variation = 0;
    if (prevSummary.totalExpenses > 0) {
      variation = ((summary.totalExpenses - prevSummary.totalExpenses) / prevSummary.totalExpenses) * 100;
    }

    // Top categories
    const categoryMap = new Map<string, number>();
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      categoryMap.set(tx.categoryId, (categoryMap.get(tx.categoryId) || 0) + tx.amount);
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        percentage: summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncomes: summary.totalIncomes,
      totalExpenses: summary.totalExpenses,
      balance,
      previousBalance: prevBalance,
      variation,
      topCategories
    };
  },

  getYearlySeries: async (year: number) => {
    const allTransactions = await TransactionRepository.getByYear(year);
    const series = Array.from({ length: 12 }, () => ({ incomes: 0, expenses: 0 }));

    allTransactions.forEach(tx => {
      const month = new Date(tx.date + 'T00:00:00').getMonth();
      if (tx.type === 'income') series[month].incomes += tx.amount;
      else series[month].expenses += tx.amount;
    });

    return series;
  }
};
