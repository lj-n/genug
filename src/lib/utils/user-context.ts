import { createContext } from 'svelte';

export const [getUserContext, setUserContext] = createContext<() => App.User>();
