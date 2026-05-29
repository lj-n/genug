import { createContext } from 'svelte';

export const [getBudgetContext, setBudgetContext] = createContext<() => App.Budget>();
