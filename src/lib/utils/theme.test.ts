import { describe, expect, it } from 'vitest';

import {
	parseTheme,
	resolveThemeClass,
	THEME_BACKGROUND,
	THEME_COOKIE_NAME,
	themeColorMeta
} from './theme';

describe('resolveThemeClass', () => {
	it('maps an explicit dark override to the dark class', () => {
		expect(resolveThemeClass('dark')).toBe('dark');
	});

	it('maps an explicit light override to the light class', () => {
		expect(resolveThemeClass('light')).toBe('light');
	});

	it('returns null for system so the media query decides', () => {
		expect(resolveThemeClass('system')).toBeNull();
	});

	it('returns null when the cookie is absent', () => {
		expect(resolveThemeClass(undefined)).toBeNull();
		expect(resolveThemeClass(null)).toBeNull();
	});

	it('returns null for an unrecognised value rather than trusting it', () => {
		expect(resolveThemeClass('')).toBeNull();
		expect(resolveThemeClass('DARK')).toBeNull();
		expect(resolveThemeClass('midnight')).toBeNull();
	});
});

describe('parseTheme', () => {
	it('keeps a valid light/dark/system value', () => {
		expect(parseTheme('light')).toBe('light');
		expect(parseTheme('dark')).toBe('dark');
		expect(parseTheme('system')).toBe('system');
	});

	it('falls back to system for absent or unrecognised values', () => {
		expect(parseTheme(undefined)).toBe('system');
		expect(parseTheme(null)).toBe('system');
		expect(parseTheme('')).toBe('system');
		expect(parseTheme('midnight')).toBe('system');
	});
});

describe('THEME_COOKIE_NAME', () => {
	it('is the theme cookie key read by hooks and written by the client', () => {
		expect(THEME_COOKIE_NAME).toBe('theme');
	});
});

describe('themeColorMeta', () => {
	it('emits a single meta with the light background for an explicit light override', () => {
		expect(themeColorMeta('light')).toBe(
			`<meta name="theme-color" content="${THEME_BACKGROUND.light}" />`
		);
	});

	it('emits a single meta with the dark background for an explicit dark override', () => {
		expect(themeColorMeta('dark')).toBe(
			`<meta name="theme-color" content="${THEME_BACKGROUND.dark}" />`
		);
	});

	it('emits two media-queried metas for system so the OS signal decides', () => {
		expect(themeColorMeta(null)).toBe(
			`<meta name="theme-color" content="${THEME_BACKGROUND.light}" media="(prefers-color-scheme: light)" />` +
				`<meta name="theme-color" content="${THEME_BACKGROUND.dark}" media="(prefers-color-scheme: dark)" />`
		);
	});

	it('mirrors the --color-background tokens from layout.css', () => {
		expect(THEME_BACKGROUND).toEqual({ dark: '#191724', light: '#fffcf8' });
	});
});
