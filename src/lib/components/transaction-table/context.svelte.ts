import { createContext } from 'svelte';

export type CellContext = {
	budgetId: string;
	editRow(rowId: string): void;
};

export const [getCellContext, setCellContext] = createContext<CellContext>();
