/**
 * Theme override — the per-device theme preference held in the `theme` cookie.
 * `system` follows the OS `prefers-color-scheme`; `light`/`dark` force that
 * theme and win over the OS signal. See CONTEXT.md and ADR-0010.
 */

/** Cookie key read server-side in `hooks.server.ts` and written by the client switcher. */
export const THEME_COOKIE_NAME = 'theme';

/** The three selectable Theme override states. */
export type Theme = 'dark' | 'light' | 'system';

/** The class placed on `<html>` for an explicit override. `system` emits none. */
export type ThemeClass = 'dark' | 'light';

/** All Theme override values, in control display order. */
export const themes: readonly Theme[] = ['system', 'light', 'dark'];

/**
 * Normalise a raw `theme` cookie value to a Theme for the switcher's selected
 * state. Anything that is not a valid override falls back to `system`.
 */
export function parseTheme(cookieValue?: null | string): Theme {
	return cookieValue === 'dark' || cookieValue === 'light' ? cookieValue : 'system';
}

/**
 * Resolve a raw `theme` cookie value to the class to place on `<html>`.
 * `light`/`dark` force that theme; `system`, absent, or any unrecognised value
 * returns `null` — no class, so the CSS `prefers-color-scheme` media query
 * decides. This is the unit under test for the dark-mode ticket.
 */
export function resolveThemeClass(cookieValue?: null | string): null | ThemeClass {
	return cookieValue === 'dark' || cookieValue === 'light' ? cookieValue : null;
}
