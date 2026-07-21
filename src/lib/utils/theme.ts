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

/**
 * The `--color-background` token per theme, mirrored from `src/routes/layout.css`.
 * Drives the standalone `theme-color` status-bar/toolbar meta. Kept next to the
 * theme constants so the coupling is visible: if those CSS tokens change, these
 * must follow.
 */
export const THEME_BACKGROUND: Record<ThemeClass, string> = {
	dark: '#191724',
	light: '#fffcf8'
};

/**
 * Build the `theme-color` meta tag(s) for the resolved theme override. An
 * explicit `light`/`dark` override emits a single meta with that theme's
 * background; `system`/absent (`null`) emits two media-queried metas so the OS
 * `prefers-color-scheme` signal decides live.
 */
export function themeColorMeta(themeClass: null | ThemeClass): string {
	if (themeClass) {
		return `<meta name="theme-color" content="${THEME_BACKGROUND[themeClass]}" />`;
	}

	return (
		`<meta name="theme-color" content="${THEME_BACKGROUND.light}" media="(prefers-color-scheme: light)" />` +
		`<meta name="theme-color" content="${THEME_BACKGROUND.dark}" media="(prefers-color-scheme: dark)" />`
	);
}
