import type { Page } from '@sveltejs/kit';

/**
 * Checks if a given id is part of the current pathname.
 */
export function isCurrentPage(page: Page, id: string) {
	if (page.params.accountId) return page.params.accountId === id;
	if (page.params.budgetId) return page.params.budgetId === id;
	return page.url.pathname.includes(id);
}
