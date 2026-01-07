<script lang="ts">
  import { page } from '$app/stores';
  import { LayoutDashboard, ReceiptText, Tags, Landmark, Settings, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { clsx } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  let collapsed = $state(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Lançamentos', icon: ReceiptText },
    { href: '/categories', label: 'Categorias', icon: Tags },
    { href: '/budgets', label: 'Orçamentos', icon: Landmark },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
  }
</script>

<aside class={cn(
  "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col",
  collapsed ? "w-20" : "w-64"
)}>
  <div class="p-6 flex items-center justify-between">
    {#if !collapsed}
      <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
        Progressão
      </h1>
    {/if}
    <button 
      onclick={() => collapsed = !collapsed}
      class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
    >
      {#if collapsed}
        <ChevronRight size={20} />
      {:else}
        <ChevronLeft size={20} />
      {/if}
    </button>
  </div>

  <nav class="flex-1 px-4 space-y-2 py-4">
    {#each navItems as item}
      <a 
        href={item.href}
        class={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-all group",
          $page.url.pathname === item.href 
            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
        )}
      >
        <item.icon size={20} class={cn(
          "transition-colors",
          $page.url.pathname === item.href ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"
        )} />
        {#if !collapsed}
          <span>{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="p-4 border-t border-slate-200 dark:border-slate-800">
    <div class={cn(
      "flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50",
      collapsed && "justify-center"
    )}>
      <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
        R
      </div>
      {#if !collapsed}
        <div class="flex flex-col">
          <span class="text-sm font-medium">Rafael</span>
          <span class="text-xs text-slate-500">Local Profile</span>
        </div>
      {/if}
    </div>
  </div>
</aside>
