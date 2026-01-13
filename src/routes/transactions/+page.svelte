<script lang="ts">
  import {
    Plus,
    Search,
    Filter,
    Trash2,
    Edit2,
    ArrowUpCircle,
    ArrowDownCircle,
    X,
    Check,
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
  } from "lucide-svelte";
  import {
    TransactionRepository,
    CategoryRepository,
  } from "$lib/db/repositories";
  import type { Transaction, Category } from "$lib/domain/types";
  import { selectedDate, filters } from "$lib/stores/app";
  import { formatCurrency, formatDate } from "$lib/domain/utils";
  import { liveQuery } from "dexie";
  import { clsx } from "clsx";
  import { fade, slide } from "svelte/transition";

  let transactions = $state<Transaction[]>([]);
  let categories = liveQuery(() => CategoryRepository.getAll());

  $effect(() => {
    const currentYear = $selectedDate.year;
    const currentMonth = $selectedDate.month;

    const observable = liveQuery(() => {
      // Repository now returns sorted by date ASC (oldest first)
      return TransactionRepository.getFiltered(currentYear, currentMonth);
    });

    const subscription = observable.subscribe((res) => {
      transactions = res;
    });

    return () => {
      subscription.unsubscribe();
    };
  });

  let isModalOpen = $state(false);
  let editingTransaction = $state<Transaction | null>(null);
  let isCategoryDropdownOpen = $state(false);

  // Form State
  let formDate = $state(new Date().toISOString().split("T")[0]);
  let formType = $state<"income" | "expense">("expense");
  let formAmount = $state<number | string>("");
  let formCategoryId = $state("");
  let formDescription = $state("");
  let formPaid = $state(true);

  // New State for Multi-month creation
  let formDay = $state(new Date().getDate());
  let formMonths = $state<number[]>([new Date().getMonth()]); // 0-11

  const MONTHS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  function openCreate() {
    editingTransaction = null;
    formDate = new Date().toISOString().split("T")[0];

    // Init multi-month defaults
    const now = new Date();
    formDay = now.getDate();
    formMonths = [now.getMonth()];

    formType = "expense";
    formAmount = "";
    formCategoryId = $categories ? $categories[0]?.id || "" : "";
    formDescription = "";
    formPaid = true;
    isModalOpen = true;
  }

  function openEdit(tx: Transaction) {
    editingTransaction = tx;
    formDate = tx.date;
    formType = tx.type;
    formAmount = tx.amount / 100;
    formCategoryId = tx.categoryId;
    formDescription = tx.description || "";
    formPaid = tx.paid ?? true;
    isModalOpen = true;
  }

  async function handleSubmit() {
    if (!formAmount || !formCategoryId) return;

    const baseData = {
      type: formType,
      amount: Math.round(Number(formAmount) * 100),
      categoryId: formCategoryId,
      description: formDescription,
      paid: formPaid,
      createdAt: editingTransaction?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (editingTransaction) {
      await TransactionRepository.update(editingTransaction.id!, {
        ...baseData,
        date: formDate,
      });
    } else {
      // Create for multiple months
      const year = new Date().getFullYear();

      for (const monthIndex of formMonths) {
        // Construct date: YYYY-MM-DD (ensure padding)
        const monthStr = (monthIndex + 1).toString().padStart(2, "0");
        const dayStr = formDay.toString().padStart(2, "0");
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        await TransactionRepository.add({
          ...baseData,
          date: dateStr,
        } as any);
      }
    }
    isModalOpen = false;
  }

  function toggleMonth(index: number) {
    if (formMonths.includes(index)) {
      if (formMonths.length > 1) {
        // Prevent unselecting all
        formMonths = formMonths.filter((m) => m !== index);
      }
    } else {
      formMonths = [...formMonths, index].sort((a, b) => a - b);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Excluir este lançamento?")) {
      await TransactionRepository.delete(id);
    }
  }

  // Derived: Filtered Transactions
  const filteredTransactions = $derived(
    (transactions || []).filter((tx) => {
      const matchesSearch = tx.description
        ?.toLowerCase()
        .includes($filters.search.toLowerCase());

      const matchesCategory =
        $filters.categoryIds.length === 0 ||
        $filters.categoryIds.includes(tx.categoryId);

      const matchesStatus =
        $filters.status === "all" ||
        ($filters.status === "paid" && tx.paid) ||
        ($filters.status === "pending" && !tx.paid);

      return matchesSearch && matchesCategory && matchesStatus;
    })
  );

  // Derived: Summary Stats
  const stats = $derived.by(() => {
    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const pending = filteredTransactions
      .filter((t) => !t.paid)
      .reduce((acc, t) => acc + (t.type === "expense" ? t.amount : 0), 0); // Only pending expenses for "Pendente de Pagamento"

    return {
      expenses,
      income,
      pending,
      balance: income - expenses,
    };
  });

  function toggleCategoryFilter(id: string) {
    if ($filters.categoryIds.includes(id)) {
      $filters.categoryIds = $filters.categoryIds.filter((c) => c !== id);
    } else {
      $filters.categoryIds = [...$filters.categoryIds, id];
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div
    class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
  >
    <div>
      <h1 class="text-3xl font-bold">Lançamentos</h1>
      <p class="text-slate-500">Gerencie suas despesas e receitas do mês.</p>
    </div>
    <button onclick={openCreate} class="btn-primary flex items-center gap-2">
      <Plus size={20} />
      Novo Lançamento
    </button>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      class="card p-4 flex flex-col gap-1 border-l-4 border-l-green-500 dark:border-l-green-500"
    >
      <div class="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <TrendingUp size={16} /> Receitas
      </div>
      <div class="text-2xl font-bold text-slate-900 dark:text-white">
        {formatCurrency(stats.income)}
      </div>
    </div>
    <div
      class="card p-4 flex flex-col gap-1 border-l-4 border-l-red-500 dark:border-l-red-500"
    >
      <div class="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <TrendingDown size={16} /> Despesas
      </div>
      <div class="text-2xl font-bold text-slate-900 dark:text-white">
        {formatCurrency(stats.expenses)}
      </div>
    </div>
    <div
      class="card p-4 flex flex-col gap-1 border-l-4 border-l-amber-500 dark:border-l-amber-500"
    >
      <div class="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <AlertCircle size={16} /> Pendente
      </div>
      <div class="text-2xl font-bold text-slate-900 dark:text-white">
        {formatCurrency(stats.pending)}
      </div>
      <div class="text-xs text-slate-400">Total a pagar</div>
    </div>
    <div
      class="card p-4 flex flex-col gap-1 border-l-4 border-l-blue-500 dark:border-l-blue-500"
    >
      <div class="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Wallet size={16} /> Saldo Estimado
      </div>
      <div
        class={clsx(
          "text-2xl font-bold",
          stats.balance >= 0
            ? "text-blue-600 dark:text-blue-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        {formatCurrency(stats.balance)}
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div
    class="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
  >
    <div
      class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
    >
      <!-- Search -->
      <div class="relative flex-1 w-full md:max-w-xs">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          bind:value={$filters.search}
          placeholder="Buscar descrição..."
          class="w-full pl-10 input-field"
        />
      </div>

      <!-- Right Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <!-- Status Filter -->
        <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onclick={() => ($filters.status = "all")}
            class={clsx(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              $filters.status === "all"
                ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}>Todos</button
          >
          <button
            onclick={() => ($filters.status = "paid")}
            class={clsx(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              $filters.status === "paid"
                ? "bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}>Pagos</button
          >
          <button
            onclick={() => ($filters.status = "pending")}
            class={clsx(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              $filters.status === "pending"
                ? "bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}>Pendentes</button
          >
        </div>

        <!-- Category Dropdown -->
        <div class="relative">
          <button
            onclick={() => (isCategoryDropdownOpen = !isCategoryDropdownOpen)}
            class={clsx(
              "btn-secondary flex items-center gap-2",
              $filters.categoryIds.length > 0 &&
                "border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20"
            )}
          >
            <Filter size={18} />
            Categorias
            {#if $filters.categoryIds.length > 0}
              <span
                class="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full"
                >{$filters.categoryIds.length}</span
              >
            {/if}
          </button>

          {#if isCategoryDropdownOpen}
            <div
              transition:fade={{ duration: 100 }}
              class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-20 p-2"
            >
              <div
                class="flex items-center justify-between px-2 py-1 mb-2 border-b border-slate-100 dark:border-slate-800"
              >
                <span class="text-xs font-semibold text-slate-500 uppercase"
                  >Filtrar Categorias</span
                >
                {#if $filters.categoryIds.length > 0}
                  <button
                    onclick={() => ($filters.categoryIds = [])}
                    class="text-xs text-red-500 hover:text-red-600 font-medium"
                    >Limpar</button
                  >
                {/if}
              </div>

              <div class="max-h-60 overflow-y-auto space-y-1">
                {#if $categories}
                  {#each $categories as category}
                    <button
                      onclick={() => toggleCategoryFilter(category.id!)}
                      class={clsx(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                        $filters.categoryIds.includes(category.id!)
                          ? "bg-slate-100 dark:bg-slate-800 font-medium"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <div
                        class="w-3 h-3 rounded-full"
                        style="background-color: {category.color}"
                      ></div>
                      <span class="flex-1 text-left">{category.name}</span>
                      {#if $filters.categoryIds.includes(category.id!)}
                        <Check
                          size={14}
                          class="text-slate-900 dark:text-white"
                        />
                      {/if}
                    </button>
                  {/each}
                {/if}
              </div>

              <!-- Backdrop to close -->
              <div
                class="fixed inset-0 z-[-1]"
                onclick={() => (isCategoryDropdownOpen = false)}
              ></div>
            </div>
          {/if}
          {#if isCategoryDropdownOpen}
            <div
              class="fixed inset-0 z-10"
              onclick={() => (isCategoryDropdownOpen = false)}
            ></div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Active Category Tags -->
    {#if $filters.categoryIds.length > 0 && $categories}
      <div
        class="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
      >
        {#each $filters.categoryIds as catId}
          {@const cat = $categories.find((c) => c.id === catId)}
          {#if cat}
            <button
              onclick={() => toggleCategoryFilter(catId)}
              class="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <div
                class="w-2 h-2 rounded-full"
                style="background-color: {cat.color}"
              ></div>
              {cat.name}
              <X size={12} class="opacity-50 hover:opacity-100" />
            </button>
          {/if}
        {/each}
        <button
          onclick={() => ($filters.categoryIds = [])}
          class="text-xs text-slate-500 hover:text-red-500 underline decoration-slate-300 underline-offset-2"
        >
          Limpar filtros
        </button>
      </div>
    {/if}
  </div>

  <!-- Transactions Table -->
  <div class="card p-0 overflow-hidden">
    <table class="w-full text-left">
      <thead
        class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800"
      >
        <tr>
          <th
            class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
            >Data</th
          >
          <th
            class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
            >Descrição</th
          >
          <th
            class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
            >Categoria</th
          >
          <th
            class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right"
            >Valor</th
          >
          <th
            class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center"
            >Pago</th
          >
          <th
            class="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right"
            >Ações</th
          >
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        {#each filteredTransactions as tx (tx.id)}
          {@const category = $categories?.find((c) => c.id === tx.categoryId)}
          <tr
            class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500"
              >{formatDate(tx.date)}</td
            >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                {#if tx.type === "income"}
                  <ArrowUpCircle class="text-green-500 shrink-0" size={18} />
                {:else}
                  <ArrowDownCircle class="text-red-500 shrink-0" size={18} />
                {/if}
                <span class="font-medium"
                  >{tx.description || "Sem descrição"}</span
                >
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style="background-color: {category?.color || '#cbd5e1'}"
              >
                {category?.name || "Indefinida"}
              </span>
            </td>
            <td
              class={clsx(
                "px-6 py-4 text-right font-bold whitespace-nowrap",
                tx.type === "income"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {tx.type === "expense" ? "-" : ""}{formatCurrency(tx.amount)}
            </td>
            <td class="px-6 py-4 text-center">
              <button
                onclick={() =>
                  TransactionRepository.update(tx.id!, { paid: !tx.paid })}
                class={clsx(
                  "p-1 rounded-full border transition-all",
                  tx.paid
                    ? "bg-green-100 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                    : "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                )}
                title={tx.paid ? "Marcar como não pago" : "Marcar como pago"}
              >
                {#if tx.paid}
                  <div class="w-4 h-4 flex items-center justify-center">✓</div>
                {:else}
                  <div class="w-4 h-4"></div>
                {/if}
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div
                class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  onclick={() => openEdit(tx)}
                  class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onclick={() => handleDelete(tx.id!)}
                  class="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-slate-500">
              <div class="flex flex-col items-center justify-center gap-2">
                <Filter size={32} class="text-slate-300 mb-2" />
                <p>Nenhum lançamento encontrado com os filtros atuais.</p>
                <button
                  onclick={() => {
                    $filters.search = "";
                    $filters.categoryIds = [];
                    $filters.status = "all";
                  }}
                  class="text-primary-600 hover:underline text-sm"
                >
                  Limpar todos os filtros
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
    >
      <div
        class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
      >
        <h2 class="text-xl font-bold">
          {editingTransaction ? "Editar" : "Novo"} Lançamento
        </h2>
        <button
          onclick={() => (isModalOpen = false)}
          class="text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        class="p-6 space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            {#if editingTransaction}
              <label class="text-sm font-medium">Data</label>
              <input
                type="date"
                bind:value={formDate}
                class="w-full input-field"
                required
              />
            {:else}
              <label class="text-sm font-medium">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                bind:value={formDay}
                class="w-full input-field"
                required
              />
            {/if}
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Tipo</label>
            <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onclick={() => (formType = "expense")}
                class={clsx(
                  "flex-1 py-1.5 rounded-md text-sm font-medium transition-all",
                  formType === "expense"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-red-600"
                    : "text-slate-500"
                )}>Despesa</button
              >
              <button
                type="button"
                onclick={() => (formType = "income")}
                class={clsx(
                  "flex-1 py-1.5 rounded-md text-sm font-medium transition-all",
                  formType === "income"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-green-600"
                    : "text-slate-500"
                )}>Receita</button
              >
            </div>
          </div>
        </div>

        {#if !editingTransaction}
          <div class="space-y-2">
            <label class="text-sm font-medium"
              >Repetir nos meses de {new Date().getFullYear()}</label
            >
            <div class="grid grid-cols-6 gap-2">
              {#each MONTHS as monthName, i}
                <button
                  type="button"
                  onclick={() => toggleMonth(i)}
                  class={clsx(
                    "flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all border",
                    formMonths.includes(i)
                      ? "bg-primary-600 text-white border-primary-600 shadow-md transform scale-105"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary-300"
                  )}
                >
                  {monthName}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="paid"
            bind:checked={formPaid}
            class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            for="paid"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >Já está pago?</label
          >
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            bind:value={formAmount}
            placeholder="0,00"
            class="w-full input-field text-xl font-bold"
            required
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Categoria</label>
          <select
            bind:value={formCategoryId}
            class="w-full input-field"
            required
          >
            {#if $categories}
              {#each $categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            {/if}
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Descrição</label>
          <input
            type="text"
            bind:value={formDescription}
            placeholder="Ex: Supermercado, Aluguel..."
            class="w-full input-field"
          />
        </div>

        <div class="pt-4 flex gap-3">
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >Cancelar</button
          >
          <button type="submit" class="flex-1 btn-primary">
            {editingTransaction ? "Salvar Lançamento" : "Adicionar Lançamento"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
