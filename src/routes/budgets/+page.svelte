<script lang="ts">
  import { untrack } from "svelte";
  import {
    CategoryRepository,
    BudgetRepository,
    TransactionRepository,
  } from "$lib/db/repositories";
  import { selectedDate } from "$lib/stores/app";
  import { formatCurrency } from "$lib/domain/utils";
  import { liveQuery } from "dexie";
  import {
    Save,
    AlertCircle,
    CheckCircle2,
    Repeat,
    Landmark,
    TrendingUp,
  } from "lucide-svelte";
  import RecurringRules from "./RecurringRules.svelte";
  import { clsx } from "clsx";

  let activeTab = $state("plans"); // 'plans' | 'rules'

  // State for raw data
  let categories = $state<any[]>([]);
  let budgets = $state<any[]>([]);
  let transactions = $state<any[]>([]);

  // Subscriptions to Dexie observables
  $effect(() => {
    const catObs = liveQuery(() => CategoryRepository.getAll());
    const catSub = catObs.subscribe((res) => (categories = res || []));

    const budgetObs = liveQuery(() =>
      BudgetRepository.getForMonth($selectedDate.year, $selectedDate.month)
    );
    const budgetSub = budgetObs.subscribe((res) => (budgets = res || []));

    const txObs = liveQuery(() =>
      TransactionRepository.getFiltered($selectedDate.year, $selectedDate.month)
    );
    const txSub = txObs.subscribe((res) => (transactions = res || []));

    return () => {
      catSub.unsubscribe();
      budgetSub.unsubscribe();
      txSub.unsubscribe();
    };
  });

  let editValues = $state<Record<string, number | string>>({});
  let isSaving = $state(false);

  // Reset and synchronize edit inputs
  $effect(() => {
    // Depend on selectedDate to reset buffers on month change
    const _ = $selectedDate;
    const dbBudgets = budgets;

    untrack(() => {
      const newValues: Record<string, number | string> = {};
      dbBudgets.forEach((b: any) => {
        if (b && b.categoryId) {
          newValues[b.categoryId] = b.amount / 100;
        }
      });
      // Important: Overwrite local state with DB state when month changes
      // or when budgets are first loaded for the month.
      editValues = newValues;
    });
  });

  async function handleSave(categoryId: string) {
    const amount = Number(editValues[categoryId]);
    if (isNaN(amount)) return;

    isSaving = true;
    try {
      await BudgetRepository.upsert({
        year: $selectedDate.year,
        month: $selectedDate.month,
        categoryId,
        amount: Math.round(amount * 100),
      });
    } catch (e) {
      console.error("Error saving budget", e);
    } finally {
      isSaving = false;
    }
  }

  // Derive processed display data
  const budgetData = $derived(
    (categories || []).map((cat) => {
      const budget = (budgets || []).find((b: any) => b.categoryId === cat.id);
      const spent = (transactions || [])
        .filter((tx: any) => tx.categoryId === cat.id && tx.type === "expense")
        .reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

      const budgetAmount = (budget as any)?.amount || 0;
      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        budgetAmount,
        spent,
        remaining,
        percentage,
      };
    })
  );

  const totalBudget = $derived(
    budgetData.reduce((sum, d) => sum + d.budgetAmount, 0)
  );
  const totalSpent = $derived(budgetData.reduce((sum, d) => sum + d.spent, 0));
  const remainingToBudget = $derived(10000000 - totalBudget); // Example logic or dynamic from income?
</script>

<div class="space-y-8 pb-10">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold">Planejamento</h1>
      <p class="text-slate-500">
        Gerencie orçamentos mensais e lançamentos fixos.
      </p>
    </div>
    <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
      <button
        onclick={() => (activeTab = "plans")}
        class={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
          activeTab === "plans"
            ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <Landmark size={18} />
        Orçamentos
      </button>
      <button
        onclick={() => (activeTab = "rules")}
        class={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
          activeTab === "rules"
            ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        <Repeat size={18} />
        Recorrências
      </button>
    </div>
  </div>

  {#if activeTab === "plans"}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        class="card bg-primary-600 text-white border-none relative overflow-hidden group"
      >
        <div
          class="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"
        ></div>
        <div class="relative z-10">
          <p
            class="text-primary-100 text-sm font-medium uppercase tracking-wider"
          >
            Total Orçado
          </p>
          <h2 class="text-4xl font-bold mt-1">{formatCurrency(totalBudget)}</h2>
        </div>
      </div>

      <div
        class="card bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
      >
        <p class="text-slate-500 text-sm font-medium uppercase tracking-wider">
          Total Gasto
        </p>
        <div class="flex items-center justify-between mt-1">
          <h2 class="text-4xl font-bold">{formatCurrency(totalSpent)}</h2>
          <span
            class={clsx(
              "px-3 py-1 rounded-full text-sm font-bold",
              totalSpent > totalBudget && totalBudget > 0
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {totalBudget > 0
              ? ((totalSpent / totalBudget) * 100).toFixed(0)
              : 0}%
          </span>
        </div>
      </div>
    </div>

    <div
      class="card p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <table class="w-full text-left">
        <thead
          class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800"
        >
          <tr>
            <th
              class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
              >Categoria</th
            >
            <th
              class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
              >Orçamento</th
            >
            <th
              class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
              >Gasto</th
            >
            <th
              class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
              >Status</th
            >
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          {#each budgetData as item (item.id)}
            <tr
              class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-2.5 h-2.5 rounded-full"
                    style="background-color: {item.color}"
                  ></div>
                  <span class="font-semibold text-slate-700 dark:text-slate-200"
                    >{item.name}</span
                  >
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="relative max-w-[140px]">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                    >R$</span
                  >
                  <input
                    type="number"
                    step="0.01"
                    bind:value={editValues[item.id!]}
                    onblur={() => handleSave(item.id!)}
                    class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-primary-500 rounded-lg text-sm font-bold outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-sm font-bold text-slate-700 dark:text-slate-200"
                    >{formatCurrency(item.spent)}</span
                  >
                  <div
                    class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                  >
                    <div
                      class={clsx(
                        "h-full transition-all duration-700",
                        item.percentage > 100
                          ? "bg-red-500"
                          : item.percentage > 80
                            ? "bg-amber-500"
                            : "bg-primary-500"
                      )}
                      style="width: {Math.min(100, item.percentage)}%"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                {#if item.budgetAmount === 0}
                  <span class="text-xs text-slate-400 italic font-medium"
                    >Não planejado</span
                  >
                {:else if item.remaining < 0}
                  <div
                    class="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-tight"
                  >
                    <AlertCircle size={14} />
                    <span
                      >Excedido {formatCurrency(Math.abs(item.remaining))}</span
                    >
                  </div>
                {:else}
                  <div
                    class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-tight"
                  >
                    <CheckCircle2 size={14} />
                    <span>{formatCurrency(item.remaining)} livre</span>
                  </div>
                {/if}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                Aguardando carregamento de categorias...
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <RecurringRules />
  {/if}
</div>
