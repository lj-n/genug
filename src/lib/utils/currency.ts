import { createContext } from 'svelte';

import type { CURRENCIES } from './currencies';

export const [getCurrency, setCurrency] = createContext<() => (typeof CURRENCIES)[number]>();
