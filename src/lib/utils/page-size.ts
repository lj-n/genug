/**
 * Remembered page size — the per-device transaction-register page size held in
 * the `pageSize` cookie. Written only by an explicit pick from the per-page
 * dropdown; mobile "load more" growth (ADR-0014) never touches it.
 */

/** Cookie key read server-side by a remote query and written by the per-page dropdown. */
export const PAGE_SIZE_COOKIE_NAME = 'pageSize';

/** The selectable per-page options, in dropdown display order. */
export const PAGE_SIZES = ['15', '25', '50', '100'] as const;

/** The page size used when no valid preference is saved. */
export const DEFAULT_PAGE_SIZE = 15;

/**
 * Resolve a raw `pageSize` cookie value to the effective default page size.
 * One of the allowed options resolves to that number; absent, malformed, or
 * no-longer-allowed values fall back to `DEFAULT_PAGE_SIZE`.
 */
export function resolvePageSize(cookieValue?: null | string): number {
	return PAGE_SIZES.some((size) => size === cookieValue) ? Number(cookieValue) : DEFAULT_PAGE_SIZE;
}
