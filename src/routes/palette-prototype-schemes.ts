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

/**
 * Personal adaptations of the chosen pair (One Light / Kanagawa Dragon).
 * Non-upstream slots are commented with the reason; everything else verbatim.
 */
export const personal: CatalogScheme[] = [
	{
		name: 'One Light (genug)',
		palette: {
			base0A: '#c18401',
			base0B: '#448f43', // upstream #50a14f: 3.1:1 → 3.8:1 for progress bars + wordmark
			base0C: '#01749f', // upstream #0184bc: 4.0:1 → 5.0:1, chip text AA
			base0D: '#2f63d8', // upstream #4078f2: 3.9:1 → 5.2:1, link/button text AA
			base0E: '#a626a4',
			base0F: '#986801',
			base00: '#fafafa',
			base01: '#fdfdfd', // upstream #f0f0f1: slabs were darker than the page; lighter like today
			base02: '#ffffff', // upstream #e5e5e6: overlays become the lightest step
			base03: '#696c77', // upstream #a0a1a7: 2.5:1 → 5.0:1, muted is real text in the app
			base04: '#a0a1a7', // upstream base03, kept in the ramp (reserved slot)
			base05: '#383a42',
			base06: '#202227',
			base07: '#090a0b',
			base08: '#ca1243',
			base09: '#d75f00'
		},
		slug: 'one-light-genug',
		variant: 'light'
	},
	{
		name: 'Kanagawa Dragon (genug)',
		palette: {
			base0A: '#c4b28a',
			base0B: '#8a9a7b',
			base0C: '#8ea4a2',
			base0D: '#8ba4b0',
			base0E: '#a292a3',
			base0F: '#b98d7b',
			base00: '#181616',
			base01: '#282727',
			base02: '#393836',
			base03: '#8a847e', // upstream #625e5a: 2.8:1 → 4.9:1, muted is real text in the app
			base04: '#737c73',
			base05: '#c5c9c5',
			base06: '#c8c093',
			base07: '#c5c9c5',
			base08: '#c4746e',
			base09: '#d4a96f' // upstream #b6927b: focus ring reads washed-out; carpYellow-leaning gold
		},
		slug: 'kanagawa-dragon-genug',
		variant: 'dark'
	}
];

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

const bySlug = new Map([...schemes, ...personal].map((s) => [s.slug, s]));

export function personalOf(variant: 'dark' | 'light'): CatalogScheme[] {
	return personal.filter((s) => s.variant === variant);
}

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
