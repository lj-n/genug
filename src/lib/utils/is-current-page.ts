import type { Page } from '@sveltejs/kit';

/**
 * Checks if a given id is part of the current pathname.
 */
export function isCurrentPage(page: Page, id: string) {
	if (page.params.account) return page.params.account === id;
	if (page.params.budget) return page.params.budget === id;
	return page.url.pathname.includes(id);
}
