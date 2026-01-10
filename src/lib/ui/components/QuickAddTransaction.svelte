<script lang="ts">
  import { Plus, X } from "lucide-svelte";
  import {
    TransactionRepository,
    CategoryRepository,
  } from "$lib/db/repositories";
  import type { Transaction } from "$lib/domain/types";
  import { liveQuery } from "dexie";
  import { clsx } from "clsx";

  let isModalOpen = $state(false);
  let categories = liveQuery(() => CategoryRepository.getAll());

  // Form State
  let formDate = $state(new Date().toISOString().split("T")[0]);
  let formType = $state<"income" | "expense">("expense");
  let formAmount = $state<number | string>("");
  let formCategoryId = $state("");
  let formDescription = $state("");

  function openCreate() {
    formDate = new Date().toISOString().split("T")[0];
    formType = "expense";
    formAmount = "";
    formCategoryId = $categories ? $categories[0]?.id || "" : "";
    formDescription = "";
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
      paid: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await TransactionRepository.add(txData as any);
    isModalOpen = false;
  }
</script>

<!-- Floating Action Button -->
<button
  onclick={openCreate}
  class="fixed right-6 bottom-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center justify-center group"
  aria-label="Adicionar Lançamento"
>
  <Plus size={28} class="transition-transform group-hover:rotate-90" />
</button>

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
        <h2 class="text-xl font-bold">Novo Lançamento Rápido</h2>
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
            class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >Cancelar</button
          >
          <button type="submit" class="flex-1 btn-primary">
            Adicionar Lançamento
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
