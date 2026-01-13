import { writable, derived } from 'svelte/store';

const now = new Date();

export const selectedDate = writable({
  year: now.getFullYear(),
  month: now.getMonth() // 0-11
});

export const theme = writable<'light' | 'dark'>('dark');

theme.subscribe((val) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', val);
    if (val === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
});

export const filters = writable<{
  search: string;
  categoryIds: string[];
  status: 'all' | 'paid' | 'pending';
}>({
  search: '',
  categoryIds: [],
  status: 'all'
});
