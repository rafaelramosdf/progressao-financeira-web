<script lang="ts">
  import {
    RecurringRepository,
    CategoryRepository,
  } from "$lib/db/repositories";
  import { RecurringService } from "$lib/services/recurring";
  import { selectedDate } from "$lib/stores/app";
  import { formatCurrency } from "$lib/domain/utils";
  import { liveQuery } from "dexie";
  import {
    Plus,
    Play,
    Trash2,
    Power,
    AlertCircle,
    X,
    RepeatIcon,
  } from "lucide-svelte";
  import type { RecurringRule } from "$lib/domain/types";
  import { clsx } from "clsx";

  let rules = $state<any[]>([]);
  let categories = $state<any[]>([]);

  $effect(() => {
    const rulesObs = liveQuery(() => RecurringRepository.getAll());
    const rulesSub = rulesObs.subscribe((res) => (rules = res || []));

    const catObs = liveQuery(() => CategoryRepository.getAll());
    const catSub = catObs.subscribe((res) => (categories = res || []));

    return () => {
      rulesSub.unsubscribe();
      catSub.unsubscribe();
    };
  });

  let isModalOpen = $state(false);
  let editingRuleId = $state<string | null>(null);
  let formType = $state<"income" | "expense">("expense");
  let formAmount = $state<number | string>("");
  let formCategoryId = $state("");
  let formDay = $state(1);
  let formDesc = $state("");

  function openCreate() {
    editingRuleId = null;
    formType = "expense";
    formAmount = "";
    formCategoryId = "";
    formDay = 1;
    formDesc = "";
    isModalOpen = true;
  }

  function openEdit(rule: RecurringRule) {
    editingRuleId = rule.id!;
    formType = rule.type;
    formAmount = rule.amount / 100;
    formCategoryId = rule.categoryId;
    formDay = rule.dayOfMonth;
    formDesc = rule.description || "";
    isModalOpen = true;
  }

  async function handleSave() {
    if (!formAmount || !formCategoryId) return;
    try {
      const ruleData = {
        type: formType,
        amount: Math.round(Number(formAmount) * 100),
        categoryId: formCategoryId,
        dayOfMonth: formDay,
        description: formDesc,
        active: true,
      };

      if (editingRuleId) {
        await RecurringRepository.update(editingRuleId, ruleData);
      } else {
        await RecurringRepository.add(ruleData);
      }
      isModalOpen = false;
    } catch (e) {
      console.error("Error saving recurring rule", e);
    }
  }

  async function toggleActive(rule: RecurringRule) {
    if (!rule.id) return;

    if (rule.active) {
      if (
        confirm(
          `Desativar esta regra irá EXCLUIR todos os seus lançamentos gerados para o ano de ${$selectedDate.year}. Deseja continuar?`
        )
      ) {
        await RecurringService.deleteForYear(
          $selectedDate.year,
          rule.description || ""
        );
        await RecurringRepository.update(rule.id, { active: false });
      }
    } else {
      await RecurringRepository.update(rule.id, { active: true });
    }
  }

  async function deleteRule(rule: RecurringRule) {
    if (!rule.id) return;
    if (
      confirm(
        `Excluir esta regra irá remover todos os seus lançamentos gerados para o ano de ${$selectedDate.year}. Deseja continuar?`
      )
    ) {
      await RecurringService.deleteForYear(
        $selectedDate.year,
        rule.description || ""
      );
      await RecurringRepository.delete(rule.id);
    }
  }

  let generating = $state(false);
  let message = $state("");

  async function generate() {
    generating = true;
    try {
      const count = await RecurringService.generateForYear($selectedDate.year);
      message = `${count} lançamentos processados (criados ou atualizados)!`;
      setTimeout(() => (message = ""), 5000);
    } catch (e) {
      console.error("Error generating transactions", e);
    } finally {
      generating = false;
    }
  }
</script>

<div class="space-y-8">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold">Recorrências</h1>
      <p class="text-slate-500">Automatize seus lançamentos fixos mensais.</p>
    </div>
    <div class="flex gap-3">
      <button
        onclick={generate}
        disabled={generating}
        class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md active:scale-95 disabled:opacity-50"
      >
        <Play size={18} />
        {generating ? "Processando..." : "Gerar/Atualizar para o Ano"}
      </button>
      <button
        onclick={openCreate}
        class="btn-primary flex items-center gap-2 shadow-md active:scale-95"
      >
        <Plus size={18} />
        Nova Regra
      </button>
    </div>
  </div>

  {#if message}
    <div
      class="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
    >
      <AlertCircle size={18} />
      {message}
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each rules as rule (rule.id)}
      {@const category = categories?.find((c) => c.id === rule.categoryId)}
      <div
        class={clsx(
          "card group border-2 transition-all hover:shadow-lg",
          rule.active
            ? "border-slate-100 dark:border-slate-800"
            : "opacity-60 grayscale border-slate-50 dark:border-slate-900"
        )}
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
            style="background-color: {category?.color || '#64748b'}"
          >
            {category?.name || "Sem Categoria"}
          </div>
          <div
            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              onclick={() => toggleActive(rule)}
              class={clsx(
                "p-1.5 rounded-lg transition-colors",
                rule.active
                  ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title={rule.active ? "Desativar" : "Ativar"}
            >
              <Power size={18} />
            </button>
            <button
              onclick={() => openEdit(rule)}
              class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              title="Editar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-pencil"
                ><path
                  d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                /><path d="m15 5 4 4" /></svg
              >
            </button>
            <button
              onclick={() => deleteRule(rule)}
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              title="Excluir"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div class="flex items-baseline gap-2 mb-1">
          <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(rule.amount)}
          </h3>
          <span
            class={clsx(
              "text-[10px] font-bold uppercase tracking-tighter p-1 rounded",
              rule.type === "income"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            )}
          >
            {rule.type === "income" ? "Receita" : "Despesa"}
          </span>
        </div>

        <p
          class="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-1 italic"
        >
          {rule.description || "Sem descrição"}
        </p>

        <div
          class="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-tighter border-t border-slate-50 dark:border-slate-800 pt-3"
        >
          <RepeatIcon size={14} />
          <span>Todo dia {rule.dayOfMonth}</span>
        </div>
      </div>
    {:else}
      <div
        class="col-span-full card py-20 text-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/40 border-dashed"
      >
        <div class="mb-2 opacity-20">
          <RepeatIcon size={48} class="mx-auto" />
        </div>
        Nenhuma regra recorrente cadastrada para automação.
      </div>
    {/each}
  </div>
</div>

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
    >
      <div
        class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
      >
        <h2 class="text-xl font-bold">
          {editingRuleId ? "Editar Regra" : "Nova Regra"} de Recorrência
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
          handleSave();
        }}
        class="p-6 space-y-4"
      >
        <div class="space-y-2">
          <label class="text-sm font-semibold">Tipo de Lançamento</label>
          <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onclick={() => (formType = "expense")}
              class={clsx(
                "flex-1 py-1.5 rounded-lg text-sm font-bold transition-all",
                formType === "expense"
                  ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600"
                  : "text-slate-500"
              )}>Despesa</button
            >
            <button
              type="button"
              onclick={() => (formType = "income")}
              class={clsx(
                "flex-1 py-1.5 rounded-lg text-sm font-bold transition-all",
                formType === "income"
                  ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600"
                  : "text-slate-500"
              )}>Receita</button
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-semibold">Valor Estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              bind:value={formAmount}
              class="w-full input-field font-bold"
              placeholder="0,00"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold">Dia da Cobrança</label>
            <input
              type="number"
              min="1"
              max="31"
              bind:value={formDay}
              class="w-full input-field"
              required
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold">Categoria</label>
          <select
            bind:value={formCategoryId}
            class="w-full input-field"
            required
          >
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold">Descrição (Opcional)</label>
          <input
            type="text"
            bind:value={formDesc}
            class="w-full input-field"
            placeholder="Ex: Assinatura de Streaming, Aluguel..."
          />
        </div>

        <div class="pt-4 flex gap-3">
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold"
            >Descartar</button
          >
          <button
            type="submit"
            class="flex-1 btn-primary shadow-lg shadow-primary-500/20"
          >
            {editingRuleId ? "Salvar Alterações" : "Criar Regra"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
