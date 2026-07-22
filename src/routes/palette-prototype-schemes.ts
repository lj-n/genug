/**
 * PROTOTYPE (#256) — throwaway, delete when the ticket closes.
 *
 * Helpers for the palette switcher: the #181 slot→token map (with where each
 * token shows up in the app), today's token values as the `current` baseline,
 * and the curated "Popular" subset of the generated catalog.
 */
import { type CatalogScheme, schemes } from './palette-prototype-catalog';

export const TOKEN_MAP = [
	{ slot: 'base00', token: '--color-background', usage: 'page background' },
	{ slot: 'base01', token: '--color-surface', usage: 'row slabs, cards, sidebar' },
	{ slot: 'base02', token: '--color-surface-high', usage: 'overlays: popovers, dialogs' },
	{ slot: 'base03', token: '--color-muted', usage: 'column headers, secondary text, €0.00' },
	{ slot: 'base05', token: '--color-foreground', usage: 'body text, positive amounts' },
	{ slot: 'base08', token: '--color-error', usage: 'overspent amounts, destructive actions' },
	{ slot: 'base09', token: '--color-focus', usage: 'keyboard focus ring' },
	{ slot: 'base0B', token: '--color-success', usage: 'target progress bars, "genug" wordmark' },
	{ slot: 'base0C', token: '--color-info', usage: 'Unallocated chip' },
	{ slot: 'base0D', token: '--color-interactive', usage: 'links, buttons, month arrows' }
] as const;

/** Today's values from layout.css — what the `current` option resolves to. */
export const currentTokens: Record<'dark' | 'light', Record<string, string>> = {
	dark: {
		'--color-background': '#191724',
		'--color-error': '#eb6f92',
		'--color-focus': '#f6c177',
		'--color-foreground': '#e0def4',
		'--color-info': '#9ccfd8',
		'--color-interactive': '#c4a7e7',
		'--color-muted': '#908caa',
		'--color-success': '#85c98d',
		'--color-surface': '#1f1d2e',
		'--color-surface-high': '#26233a'
	},
	light: {
		'--color-background': '#fffcf8',
		'--color-error': '#b04641',
		'--color-focus': '#bf8339',
		'--color-foreground': '#2d2a3e',
		'--color-info': '#286983',
		'--color-interactive': '#8467a6',
		'--color-muted': '#696671',
		'--color-success': '#497f4f',
		'--color-surface': '#fffefd',
		'--color-surface-high': '#fffffe'
	}
};

export function toTokens(scheme: CatalogScheme): Record<string, string> {
	return Object.fromEntries(TOKEN_MAP.map(({ slot, token }) => [token, scheme.palette[slot]]));
}

/** Widely-used families, surfaced in their own optgroup. Order = cycle order. */
const POPULAR_SLUGS = [
	'rose-pine-dawn',
	'rose-pine',
	'rose-pine-moon',
	'flexoki-light',
	'flexoki-dark',
	'everforest-light-medium',
	'everforest-dark-medium',
	'catppuccin-latte',
	'catppuccin-mocha',
	'catppuccin-frappe',
	'catppuccin-macchiato',
	'gruvbox-material-light-medium',
	'gruvbox-material-dark-medium',
	'gruvbox-light-medium',
	'gruvbox-dark-medium',
	'solarized-light',
	'solarized-dark',
	'selenized-light',
	'selenized-dark',
	'nord-light',
	'nord',
	'one-light',
	'onedark',
	'github',
	'github-dark',
	'tokyo-night-light',
	'tokyo-night-dark',
	'tokyo-night-storm',
	'ayu-light',
	'ayu-dark',
	'ayu-mirage',
	'kanagawa',
	'kanagawa-dragon',
	'papercolor-light',
	'papercolor-dark',
	'material-lighter',
	'material',
	'material-darker',
	'measured-light',
	'measured-dark',
	'dracula',
	'monokai',
	'oceanicnext',
	'zenburn',
	'atelier-dune-light',
	'atelier-dune',
	'horizon-light',
	'horizon-dark'
];

const bySlug = new Map(schemes.map((s) => [s.slug, s]));

export function popularOf(variant: 'dark' | 'light'): CatalogScheme[] {
	return POPULAR_SLUGS.map((slug) => bySlug.get(slug)).filter(
		(s): s is CatalogScheme => !!s && s.variant === variant
	);
}

export function restOf(variant: 'dark' | 'light'): CatalogScheme[] {
	const popular = new Set(POPULAR_SLUGS);
	return schemes.filter((s) => s.variant === variant && !popular.has(s.slug));
}

export function schemeBySlug(slug: null | string): CatalogScheme | undefined {
	return slug ? bySlug.get(slug) : undefined;
}
