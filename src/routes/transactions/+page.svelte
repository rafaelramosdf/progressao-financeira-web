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

  let transactions = $state<Transaction[]>([]);
  let categories = liveQuery(() => CategoryRepository.getAll());

  $effect(() => {
    // [DEBUG] Monitorando mudança de data
    console.log("[DEBUG $effect] Date changed:", $selectedDate);

    // Capturar valores para garantir reatividade
    const currentYear = $selectedDate.year;
    const currentMonth = $selectedDate.month;

    const observable = liveQuery(() => {
      console.log("[DEBUG liveQuery] Executing query for:", {
        currentYear,
        currentMonth,
      });
      return TransactionRepository.getFiltered(currentYear, currentMonth);
    });

    const subscription = observable.subscribe((res) => {
      console.log("[DEBUG subscribe] Received transactions:", res.length);
      transactions = res;
    });

    return () => {
      console.log("[DEBUG $effect] Cleanup");
      subscription.unsubscribe();
    };
  });

  let isModalOpen = $state(false);
  let editingTransaction = $state<Transaction | null>(null);

  // Form State
  let formDate = $state(new Date().toISOString().split("T")[0]);
  let formType = $state<"income" | "expense">("expense");
  let formAmount = $state<number | string>("");
  let formCategoryId = $state("");

  let formDescription = $state("");
  let formPaid = $state(true);

  function openCreate() {
    editingTransaction = null;
    formDate = new Date().toISOString().split("T")[0];
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

    const txData: Omit<Transaction, "id"> = {
      date: formDate,
      type: formType,
      amount: Math.round(Number(formAmount) * 100),
      categoryId: formCategoryId,
      description: formDescription,
      paid: formPaid,
      createdAt: editingTransaction?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (editingTransaction) {
      await TransactionRepository.update(editingTransaction.id!, txData);
    } else {
      await TransactionRepository.add(txData as any);
    }
    isModalOpen = false;
  }

  async function handleDelete(id: string) {
    if (confirm("Excluir este lançamento?")) {
      await TransactionRepository.delete(id);
    }
  }

  const filteredTransactions = $derived(
    (transactions || []).filter((tx) => {
      const matchesSearch = tx.description
        ?.toLowerCase()
        .includes($filters.search.toLowerCase());
      const matchesCategory =
        !$filters.categoryId || tx.categoryId === $filters.categoryId;
      return matchesSearch && matchesCategory;
    })
  );
</script>

<div class="space-y-6">
  <div
    class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
  >
    <div>
      <h1 class="text-3xl font-bold">Lançamentos</h1>
      <p class="text-slate-500">
        Acompanhe e gerencie todos os seus movimentos financeiros.
      </p>
    </div>
    <button onclick={openCreate} class="btn-primary flex items-center gap-2">
      <Plus size={20} />
      Novo Lançamento
    </button>
  </div>

  <div class="flex flex-col md:flex-row gap-4">
    <div class="flex-1 relative">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <input
        type="text"
        bind:value={$filters.search}
        placeholder="Buscar por descrição..."
        class="w-full pl-10 input-field"
      />
    </div>
    <div class="flex gap-4">
      <select
        bind:value={$filters.categoryId}
        class="input-field min-w-[180px]"
      >
        <option value="">Todas as Categorias</option>
        {#if $categories}
          {#each $categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        {/if}
      </select>
    </div>
  </div>

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
        {#each filteredTransactions as tx}
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
            <td colspan="5" class="px-6 py-12 text-center text-slate-500">
              Nenhum lançamento encontrado para este período.
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
            <label class="text-sm font-medium">Data</label>
            <input
              type="date"
              bind:value={formDate}
              class="w-full input-field"
              required
            />
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
