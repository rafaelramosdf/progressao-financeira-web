# Progressão Financeira - AI Agent Instructions

## Project Overview
Offline-first personal finance PWA built with SvelteKit 2 + Svelte 5, IndexedDB (Dexie), and TailwindCSS 4. Deployable as web app or Electron desktop app. All data stored locally in browser.

## Architecture & Data Flow

### Database Layer (`src/lib/db/`)
- **Schema**: `FinanceDB` class extends Dexie with 4 tables: `transactions`, `categories`, `budgets`, `recurringRules`
- **Repositories**: Facade pattern over Dexie tables - never access `db` directly outside repositories
- **Indexes**: Compound indexes like `[date+type]` and `[year+month+categoryId]` - respect these in queries
- Data flows: UI → Repository → Dexie → IndexedDB

### Service Layer (`src/lib/services/`)
- **Business logic only** - no direct UI concerns
- `FinanceService`: Aggregations and calculations (monthly summaries, yearly series)
- `RecurringService`: Auto-generates transactions from rules, tracks via `lastGeneratedFor`
- `BackupService`: Import/export entire database to JSON (includes version field for future migrations)

### Domain Layer (`src/lib/domain/`)
- **types.ts**: Single source of truth for TypeScript interfaces
- **utils.ts**: Currency always stored as **cents** (integers) - use `toCents()`/`fromCents()` conversions
- All dates are `YYYY-MM-DD` strings (ISO 8601 format) for IndexedDB range queries

### State Management (`src/lib/stores/`)
- Global stores: `selectedDate` (current month filter), `theme`, `filters` (search/category)
- Use `liveQuery` from Dexie for reactive database queries in Svelte components
- Pattern: `$effect()` + `liveQuery()` + subscription cleanup for reactive data

## Svelte 5 Patterns (Critical)

This project uses **Svelte 5 runes** - completely different from Svelte 4:

```svelte
// ✅ Correct Svelte 5
let count = $state(0);
let doubled = $derived(count * 2);
let { children } = $props();

$effect(() => {
  // Reactive side effect
  const sub = observable.subscribe(result => {
    count = result;
  });
  return () => sub.unsubscribe();
});

// ❌ Wrong (Svelte 4 syntax)
let count = 0; // Not reactive!
$: doubled = count * 2; // Removed in Svelte 5
export let children; // Use $props() instead
```

**Key differences:**
- Use `$state()` not plain variables for reactivity
- Use `$derived()` not `$:` reactive statements
- Use `$props()` not `export let`
- Use `$effect()` not `onMount()` for reactive side effects
- Event handlers: `onclick={}` not `on:click={}`

## Component Patterns

### Reactive Database Queries
```typescript
import { liveQuery } from 'dexie';

let transactions = $state<Transaction[]>([]);

$effect(() => {
  const observable = liveQuery(() => 
    TransactionRepository.getFiltered($selectedDate.year, $selectedDate.month)
  );
  
  const subscription = observable.subscribe(result => {
    transactions = result;
  });
  
  return () => subscription.unsubscribe();
});
```

### Form Handling
- Use `$state()` for all form fields
- Amount input: Display as currency (divided by 100), store as cents (multiplied by 100)
- Date inputs: Use `YYYY-MM-DD` format directly (matches database format)
- Timestamps: `createdAt`/`updatedAt` are epoch milliseconds (`Date.now()`)

### Styling
- TailwindCSS 4 with CSS-first configuration (no `tailwind.config.js`)
- Dark mode: `dark:` prefix (toggled via `theme` store)
- Component classes: `input-field`, `button-primary` (defined in `app.css`)

## Development Workflows

### Running the App
- **Web dev**: `npm run dev` → http://localhost:5173
- **Electron dev**: `npm run electron:dev` (concurrently runs Vite + Electron with hot reload)
- **Build web**: `npm run build` → `build/` folder (SPA mode with `fallback: 'index.html'`)
- **Build desktop**: `npm run electron:build` → `dist/` folder (Windows NSIS installer)

### Database Debugging
- Use browser DevTools → Application → IndexedDB → FinanceDB
- Seed data auto-runs on first launch via `CategoryRepository.seed()` in `+layout.svelte`
- Reset: Use "Resetar Dados" in Settings page (clears all tables + re-seeds categories)

### Service Worker
- Cache-first for static assets, network-first for dynamic content
- Auto-caches on install, cleans old caches on activate
- Version tied to SvelteKit's `$service-worker` module

## Critical Conventions

1. **Currency**: Always store as integers (cents). Display conversions happen in UI layer only.
2. **Dates**: ISO strings (`YYYY-MM-DD`) for consistency with IndexedDB range queries.
3. **Month indexing**: JavaScript convention (0-11), not 1-12. UI displays via `getMonthName()`.
4. **Repository pattern**: All database access goes through repository functions, never direct `db.table.method()` calls.
5. **Svelte 5 runes**: No Svelte 4 syntax (`$:`, `export let`, `on:*`) allowed.
6. **Type safety**: Omit `id` when creating records (`Omit<Transaction, 'id'>`) since Dexie auto-generates.

## File Naming
- **Pages**: `+page.svelte` (SvelteKit convention)
- **Layouts**: `+layout.svelte` (SvelteKit convention)
- **Components**: PascalCase (e.g., `QuickAddTransaction.svelte`)
- **Services/Utils**: camelCase (e.g., `finance.ts`, `recurring.ts`)

## Testing & Validation
- Type checking: `npm run check` (svelte-check with TypeScript)
- No unit tests configured currently
- Manual testing via Electron or browser DevTools

## External Dependencies (Non-obvious)
- **Dexie**: Reactive IndexedDB wrapper - use `liveQuery()` for Svelte integration
- **date-fns**: Date formatting with `ptBR` locale
- **clsx**: Conditional class merging (use with Tailwind)
- **electron-serve**: Serves `build/` folder in production Electron builds
