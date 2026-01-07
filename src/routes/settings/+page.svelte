<script lang="ts">
  import { BackupService } from "$lib/services/backup";
  import { theme } from "$lib/stores/app";
  import {
    Download,
    Upload,
    Trash2,
    Sun,
    Moon,
    ShieldCheck,
    AlertTriangle,
    Github,
    Info,
  } from "lucide-svelte";

  let importFile: HTMLInputElement;
  let isImporting = $state(false);
  let message = $state({ text: "", type: "info" });

  function showMessage(text: string, type = "info") {
    message = { text, type };
    setTimeout(() => (message = { text: "", type: "info" }), 5000);
  }

  async function handleExport() {
    try {
      await BackupService.exportData();
      showMessage("Dados exportados com sucesso!", "success");
    } catch (e) {
      showMessage("Erro ao exportar dados.", "error");
    }
  }

  async function handleImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (
      confirm(
        "Atenção: A importação substituirá todos os dados atuais. Deseja continuar?"
      )
    ) {
      isImporting = true;
      try {
        await BackupService.importData(file);
        showMessage("Dados importados com sucesso!", "success");
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showMessage(
          "Erro ao importar arquivo: " + (err as Error).message,
          "error"
        );
      } finally {
        isImporting = false;
      }
    }
  }

  async function handleReset() {
    if (
      confirm(
        "AVISO: Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita."
      )
    ) {
      await BackupService.resetAll();
      showMessage("Todos os dados foram resetados.", "success");
      setTimeout(() => window.location.reload(), 1500);
    }
  }
</script>

<div class="space-y-8 max-w-4xl">
  <div>
    <h1 class="text-3xl font-bold">Configurações</h1>
    <p class="text-slate-500">
      Gerencie suas preferências e segurança dos dados.
    </p>
  </div>

  {#if message.text}
    <div
      class={clsx(
        "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
        message.type === "success"
          ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
          : message.type === "error"
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
      )}
    >
      <Info size={18} />
      {message.text}
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Appearance Section -->
    <div class="card space-y-6">
      <div class="flex items-center gap-3 text-slate-800 dark:text-slate-200">
        <Sun size={20} class="text-primary-600" />
        <h2 class="text-lg font-bold">Aparência</h2>
      </div>

      <div
        class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
      >
        <div>
          <p class="font-semibold">Tema do Sistema</p>
          <p class="text-sm text-slate-500">
            Escolha entre modo claro e escuro.
          </p>
        </div>
        <button
          onclick={() =>
            theme.update((t) => (t === "light" ? "dark" : "light"))}
          class="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600"
        >
          {#if $theme === "light"}
            <Moon size={20} class="text-slate-600" />
          {:else}
            <Sun size={20} class="text-yellow-400" />
          {/if}
        </button>
      </div>
    </div>

    <!-- Security/Backup Section -->
    <div class="card space-y-6">
      <div class="flex items-center gap-3 text-slate-800 dark:text-slate-200">
        <ShieldCheck size={20} class="text-primary-600" />
        <h2 class="text-lg font-bold">Backup & Dados</h2>
      </div>

      <div class="space-y-3">
        <button
          onclick={handleExport}
          class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all group"
        >
          <div class="flex items-center gap-3">
            <Download
              size={18}
              class="text-slate-400 group-hover:text-primary-600"
            />
            <span class="font-medium">Exportar Backup</span>
          </div>
          <span class="text-xs text-slate-400 font-mono">.JSON</span>
        </button>

        <label
          class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all group cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <Upload
              size={18}
              class="text-slate-400 group-hover:text-primary-600"
            />
            <span class="font-medium">Importar Backup</span>
          </div>
          <input
            type="file"
            accept=".json"
            class="hidden"
            onchange={handleImport}
            disabled={isImporting}
          />
          <span class="text-xs text-slate-400">UPLOAD</span>
        </label>
      </div>
    </div>

    <!-- Danger Zone -->
    <div
      class="card md:col-span-2 border-red-100 dark:border-red-900/30 bg-red-50/10"
    >
      <div class="flex items-center gap-3 text-red-600 mb-6">
        <AlertTriangle size={20} />
        <h2 class="text-lg font-bold">Zona de Perigo</h2>
      </div>

      <div
        class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30"
      >
        <div>
          <p class="font-semibold text-red-700 dark:text-red-400">
            Apagar todos os dados
          </p>
          <p class="text-sm text-red-600/70 dark:text-red-400/60">
            Isso removerá permanentemente todos os lançamentos e categorias.
          </p>
        </div>
        <button
          onclick={handleReset}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-sm flex items-center gap-2"
        >
          <Trash2 size={18} />
          Resetar App
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="md:col-span-2 py-8 text-center space-y-4">
      <div class="flex justify-center gap-6 grayscale opacity-40">
        <Info size={24} />
      </div>
      <p class="text-slate-400 text-sm">
        Progressão Financeira MVP v1.0.0<br />
        100% Offline-first & Privacy Focused
      </p>
    </div>
  </div>
</div>
