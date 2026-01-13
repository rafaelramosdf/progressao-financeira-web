<script lang="ts">
  import { onMount } from "svelte";
  import { FinanceService } from "$lib/services/finance";
  import { CategoryRepository } from "$lib/db/repositories";
  import { selectedDate } from "$lib/stores/app";
  import { formatCurrency } from "$lib/domain/utils";
  import { liveQuery } from "dexie";
  import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Trophy,
    AlertCircle,
  } from "lucide-svelte";
  import { clsx } from "clsx";

  // Chart components setup would go here, using placeholders for now

  let summary = $state<any>(null);
  let yearlySeries = $state<any[]>([]);
  let categories = liveQuery(() => CategoryRepository.getAll());

  async function loadData() {
    summary = await FinanceService.getMonthlySummary(
      $selectedDate.year,
      $selectedDate.month
    );
    yearlySeries = await FinanceService.getYearlySeries($selectedDate.year);
  }

  $effect(() => {
    // Re-run whenever selectedDate values change
    FinanceService.getMonthlySummary(
      $selectedDate.year,
      $selectedDate.month
    ).then((res) => (summary = res));
    FinanceService.getYearlySeries($selectedDate.year).then(
      (res) => (yearlySeries = res)
    );
  });

  const top3Months = $derived(
    yearlySeries
      .map((s, i) => ({ month: i, expenses: s.expenses }))
      .sort((a, b) => b.expenses - a.expenses)
      .slice(0, 3)
  );

  const maxYearlyBalance = $derived(
    Math.max(...yearlySeries.map((m) => Math.abs(m.incomes - m.expenses)), 0) ||
      1
  );

  const avgDailySpent = $derived(
    summary
      ? summary.totalExpenses /
          new Date($selectedDate.year, $selectedDate.month + 1, 0).getDate()
      : 0
  );
</script>

<div class="space-y-8 pb-10">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold">Olá, Rafael 👋</h1>
      <p class="text-slate-500">
        Aqui está o resumo do seu progresso financeiro.
      </p>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card overflow-hidden relative group">
      <div
        class="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"
      ></div>
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center"
        >
          <TrendingUp size={24} />
        </div>
        <div>
          <p class="text-sm text-slate-500 font-medium">Receitas no Mês</p>
          <h3 class="text-2xl font-bold text-green-600">
            {formatCurrency(summary?.totalIncomes || 0)}
          </h3>
        </div>
      </div>
    </div>

    <div class="card dark:bg-slate-900 overflow-hidden relative group">
      <div
        class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"
      ></div>
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center"
        >
          <TrendingDown size={24} />
        </div>
        <div>
          <p class="text-sm text-slate-500 font-medium">Despesas no Mês</p>
          <div class="flex items-baseline gap-2">
            <h3 class="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalExpenses || 0)}
            </h3>
            {#if summary?.variation !== 0}
              <span
                class={clsx(
                  "text-xs font-bold px-1.5 py-0.5 rounded flex items-center",
                  summary?.variation > 0
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                )}
              >
                {summary?.variation > 0 ? "+" : ""}{summary?.variation.toFixed(
                  1
                )}%
              </span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div
      class="card {summary?.balance < 0
        ? 'bg-red-600'
        : 'bg-primary-600'} text-white overflow-hidden relative group"
    >
      <div
        class="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all"
      ></div>
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-2xl text-white flex items-center justify-center"
        >
          <Wallet size={24} />
        </div>
        <div>
          <p class="text-sm text-primary-100 font-medium">Saldo do Mês</p>
          <h3 class="text-2xl font-bold">
            {formatCurrency(summary?.balance || 0)}
          </h3>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Main Chart Placeholder -->
    <div class="lg:col-span-2 card">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-lg font-bold">Progressão Anual</h3>
        <span class="text-sm text-slate-500"
          >Saldo mensal em {$selectedDate.year}</span
        >
      </div>
      <div class="h-64 flex items-end justify-between gap-2 px-2">
        {#each yearlySeries as month, i}
          {@const balance = month.incomes - month.expenses}
          <div
            class="flex-1 flex flex-col justify-end items-center gap-2 group relative h-full"
          >
            <div
              class="w-full rounded-t-lg transition-all duration-500 overflow-hidden flex flex-col justify-end {balance <
              0
                ? 'bg-red-500 group-hover:bg-red-600'
                : 'bg-primary-500 group-hover:bg-primary-600'}"
              style="height: {Math.max(
                0,
                (Math.abs(balance) / maxYearlyBalance) * 100
              )}%"
            >
              <div
                class="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity {balance <
                0
                  ? 'bg-red-600'
                  : 'bg-primary-600'}"
              ></div>
            </div>
            <span class="text-[10px] font-medium text-slate-400 uppercase"
              >{new Date(2000, i, 1)
                .toLocaleString("pt-BR", { month: "short" })
                .replace(".", "")}</span
            >
            <!-- Tooltip -->
            <div
              class="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10"
            >
              {formatCurrency(balance)}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Insights side column -->
    <div class="space-y-6">
      <div class="card">
        <h3 class="text-lg font-bold mb-4">Insights Rápidos</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center"
              >
                <Calendar size={16} />
              </div>
              <span class="text-sm text-slate-600 dark:text-slate-400"
                >Gasto Médio/Dia</span
              >
            </div>
            <span class="font-bold">{formatCurrency(avgDailySpent)}</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center"
              >
                <Trophy size={16} />
              </div>
              <span class="text-sm text-slate-600 dark:text-slate-400"
                >Maior Categoria</span
              >
            </div>
            <span class="font-bold">
              {$categories?.find(
                (c) => c.id === summary?.topCategories[0]?.categoryId
              )?.name || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div class="card bg-slate-50 dark:bg-slate-800/40 border-none">
        <h3
          class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4"
        >
          Meses mais pesados
        </h3>
        <div class="space-y-3">
          {#each top3Months as item, i}
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium capitalize"
                >{new Date(0, item.month).toLocaleString("pt-BR", {
                  month: "long",
                })}</span
              >
              <span class="text-sm font-bold"
                >{formatCurrency(item.expenses)}</span
              >
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Top Categories in current month -->
  <div class="card">
    <h3 class="text-lg font-bold mb-6">Gastos por Categoria</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each summary?.topCategories || [] as item}
        {@const category = $categories?.find((c) => c.id === item.categoryId)}
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-300"
              >{category?.name}</span
            >
            <span class="text-slate-500">{item.percentage.toFixed(0)}%</span>
          </div>
          <div
            class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
          >
            <div
              class="h-full rounded-full transition-all duration-1000"
              style="width: {item.percentage}%; background-color: {category?.color}"
            ></div>
          </div>
          <p class="text-xs font-bold text-right">
            {formatCurrency(item.amount)}
          </p>
        </div>
      {:else}
        <div class="col-span-full py-10 text-center text-slate-400">
          <AlertCircle class="mx-auto mb-2 opacity-20" size={48} />
          Nenhum gasto registrado este mês.
        </div>
      {/each}
    </div>
  </div>
</div>
