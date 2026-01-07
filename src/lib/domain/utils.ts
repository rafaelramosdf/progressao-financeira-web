import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amountInCents / 100);
};

export const formatDate = (dateString: string, formatStr = 'dd/MM/yyyy'): string => {
  return format(parseISO(dateString), formatStr, { locale: ptBR });
};

export const getMonthName = (month: number): string => {
  const date = new Date(2000, month, 1);
  return format(date, 'MMMM', { locale: ptBR });
};

export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

export const fromCents = (cents: number): number => {
  return cents / 100;
};
