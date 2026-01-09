<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { CategoryRepository } from "$lib/db/repositories";
  import { theme } from "$lib/stores/app";
  import Sidebar from "$lib/ui/layouts/Sidebar.svelte";
  import Topbar from "$lib/ui/layouts/Topbar.svelte";
  import QuickAddTransaction from "$lib/ui/components/QuickAddTransaction.svelte";

  let { children } = $props();

  onMount(async () => {
    await CategoryRepository.seed();
  });
</script>

<div class="main-wrapper flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
  <Sidebar />

  <div class="flex-1 flex flex-col overflow-hidden">
    <Topbar />

    <main class="flex-1 overflow-y-auto p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        {@render children()}
      </div>
    </main>
  </div>

  <QuickAddTransaction />
</div>
