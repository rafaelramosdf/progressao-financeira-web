<script lang="ts">
  import { Plus, Trash2, Edit2, X } from "lucide-svelte";
  import { CategoryRepository } from "$lib/db/repositories";
  import type { Category } from "$lib/domain/types";
  import { liveQuery } from "dexie";

  let categories = liveQuery(() => CategoryRepository.getAll());

  let isModalOpen = $state(false);
  let editingCategory = $state<Category | null>(null);
  let formName = $state("");
  let formColor = $state("#3b82f6");

  function openCreate() {
    editingCategory = null;
    formName = "";
    formColor = "#3b82f6";
    isModalOpen = true;
  }

  function openEdit(category: Category) {
    editingCategory = category;
    formName = category.name;
    formColor = category.color;
    isModalOpen = true;
  }

  async function handleSubmit() {
    if (!formName) return;

    if (editingCategory) {
      await CategoryRepository.update(editingCategory.id!, {
        name: formName,
        color: formColor,
      });
    } else {
      await CategoryRepository.add({ name: formName, color: formColor });
    }
    isModalOpen = false;
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await CategoryRepository.delete(id);
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Categorias</h1>
      <p class="text-slate-500">
        Organize seus lançamentos por categorias personalizadas.
      </p>
    </div>
    <button onclick={openCreate} class="btn-primary flex items-center gap-2">
      <Plus size={20} />
      Nova Categoria
    </button>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#if $categories}
      {#each $categories as category}
        <div
          class="card flex items-center justify-between group hover:border-primary-300 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style="background-color: {category.color}"
            >
              {category.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 class="font-semibold">{category.name}</h3>
              <p class="text-xs text-slate-500 uppercase tracking-wider">
                {category.color}
              </p>
            </div>
          </div>

          <div
            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              onclick={() => openEdit(category)}
              class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary-600 transition-colors"
            >
              <Edit2 size={18} />
            </button>
            <button
              onclick={() => handleDelete(category.id!)}
              class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
    >
      <div
        class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
      >
        <h2 class="text-xl font-bold">
          {editingCategory ? "Editar" : "Nova"} Categoria
        </h2>
        <button
          onclick={() => (isModalOpen = false)}
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
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
        <div class="space-y-2">
          <label
            for="name"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >Nome da Categoria</label
          >
          <input
            type="text"
            id="name"
            bind:value={formName}
            placeholder="Ex: Alimentação, Lazer..."
            class="w-full input-field"
            required
          />
        </div>

        <div class="space-y-2">
          <label
            for="color"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >Cor</label
          >
          <div class="flex items-center gap-4">
            <input
              type="color"
              id="color"
              bind:value={formColor}
              class="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
            />
            <input
              type="text"
              bind:value={formColor}
              class="flex-1 input-field font-mono"
            />
          </div>
        </div>

        <div class="pt-4 flex gap-3">
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button type="submit" class="flex-1 btn-primary">
            {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
