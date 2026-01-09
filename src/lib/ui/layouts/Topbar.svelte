<script lang="ts">
  import { selectedDate, theme } from "$lib/stores/app";
  import { getMonthName } from "$lib/domain/utils";
  import {
    Sun,
    Moon,
    Calendar,
    ChevronLeft,
    ChevronRight,
  } from "lucide-svelte";

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );
  const months = Array.from({ length: 12 }, (_, i) => i);

  function prevMonth() {
    selectedDate.update((d) => {
      let newMonth = d.month - 1;
      let newYear = d.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      return { year: newYear, month: newMonth };
    });
  }

  function nextMonth() {
    selectedDate.update((d) => {
      let newMonth = d.month + 1;
      let newYear = d.year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      return { year: newYear, month: newMonth };
    });
  }
</script>

<header
  class="topbar bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between"
>
  <div class="flex items-center gap-4">
    <div
      class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
    >
      <button
        onclick={prevMonth}
        class="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-400"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        class="px-4 py-1 flex items-center gap-2 font-semibold min-w-40 justify-center"
      >
        <Calendar size={18} class="text-primary-600" />
        <span class="capitalize">{getMonthName($selectedDate.month)}</span>
        <span class="text-slate-400">{$selectedDate.year}</span>
      </div>

      <button
        onclick={nextMonth}
        class="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-400"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  </div>

  <div class="flex items-center gap-4">
    <!-- Theme toggle removed as Dark Mode is now enforced -->
  </div>
</header>
