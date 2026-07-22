/**
 * PROTOTYPE (#256) — throwaway, delete when the ticket closes.
 *
 * Candidate base16 schemes for the app default palette, rendered live by
 * `palette-prototype.svelte`. Full 16-slot palettes are kept (verbatim from
 * tinted-theming/schemes, spec-0.11) so the winning scheme can be authored as
 * a proper base16 file afterwards; the app only consumes the 10 tokens below.
 *
 * Slot → token map per #181:
 *   background→base00, surface→base01, surface-high→base02, muted→base03,
 *   foreground→base05, error→base08, focus→base09, success→base0B,
 *   info→base0C, interactive→base0D.
 */

export type Base16Palette = {
	base0A: string;
	base0B: string;
	base0C: string;
	base0D: string;
	base0E: string;
	base0F: string;
	base00: string;
	base01: string;
	base02: string;
	base03: string;
	base04: string;
	base05: string;
	base06: string;
	base07: string;
	base08: string;
	base09: string;
}

export type Candidate = {
	dark: Base16Palette;
	key: string;
	light: Base16Palette;
	name: string;
}

export function toTokens(p: Base16Palette): Record<string, string> {
	return {
		'--color-background': p.base00,
		'--color-error': p.base08,
		'--color-focus': p.base09,
		'--color-foreground': p.base05,
		'--color-info': p.base0C,
		'--color-interactive': p.base0D,
		'--color-muted': p.base03,
		'--color-success': p.base0B,
		'--color-surface': p.base01,
		'--color-surface-high': p.base02
	};
}

export const candidates: Candidate[] = [
	{
		dark: {
			base0A: '#ebbcba',
			base0B: '#31748f',
			base0C: '#9ccfd8',
			base0D: '#c4a7e7',
			base0E: '#f6c177',
			base0F: '#524f67',
			base00: '#191724',
			base01: '#1f1d2e',
			base02: '#26233a',
			base03: '#6e6a86',
			base04: '#908caa',
			base05: '#e0def4',
			base06: '#e0def4',
			base07: '#524f67',
			base08: '#eb6f92',
			base09: '#f6c177'
		},
		key: 'a',
		light: {
			base0A: '#d7827e',
			base0B: '#286983',
			base0C: '#56949f',
			base0D: '#907aa9',
			base0E: '#ea9d34',
			base0F: '#cecacd',
			base00: '#faf4ed',
			base01: '#fffaf3',
			base02: '#f2e9de',
			base03: '#9893a5',
			base04: '#797593',
			base05: '#575279',
			base06: '#575279',
			base07: '#cecacd',
			base08: '#b4637a',
			base09: '#ea9d34'
		},
		name: 'Rosé Pine (dawn/main, strict slots)'
	},
	{
		dark: {
			base0A: '#D0A215',
			base0B: '#879A39',
			base0C: '#3AA99F',
			base0D: '#4385BE',
			base0E: '#8B7EC8',
			base0F: '#CE5D97',
			base00: '#100F0F',
			base01: '#1C1B1A',
			base02: '#282726',
			base03: '#575653',
			base04: '#878580',
			base05: '#CECDC3',
			base06: '#E6E4D9',
			base07: '#FFFCF0',
			base08: '#D14D41',
			base09: '#DA702C'
		},
		key: 'b',
		light: {
			base0A: '#AD8301',
			base0B: '#66800B',
			base0C: '#24837B',
			base0D: '#205EA6',
			base0E: '#5E409D',
			base0F: '#A02F6F',
			base00: '#FFFCF0',
			base01: '#F2F0E5',
			base02: '#E6E4D9',
			base03: '#CECDC3',
			base04: '#9F9D96',
			base05: '#403E3C',
			base06: '#282726',
			base07: '#100F0F',
			base08: '#AF3029',
			base09: '#BC5215'
		},
		name: 'Flexoki (light/dark)'
	},
	{
		dark: {
			base0A: '#dbbc7f',
			base0B: '#a7c080',
			base0C: '#83c092',
			base0D: '#7fbbb3',
			base0E: '#d699b6',
			base0F: '#514045',
			base00: '#2d353b',
			base01: '#343f44',
			base02: '#3d484d',
			base03: '#475258',
			base04: '#7a8478',
			base05: '#859289',
			base06: '#9da9a0',
			base07: '#d3c6aa',
			base08: '#e67e80',
			base09: '#e69875'
		},
		key: 'c',
		light: {
			base0A: '#dfa000',
			base0B: '#8da101',
			base0C: '#35a77c',
			base0D: '#3a94c5',
			base0E: '#df69ba',
			base0F: '#829181',
			base00: '#fdf6e3',
			base01: '#f4f0d9',
			base02: '#e6e2cc',
			base03: '#939f91',
			base04: '#829181',
			base05: '#5c6a72',
			base06: '#475258',
			base07: '#2d353b',
			base08: '#f85552',
			base09: '#f57d26'
		},
		name: 'Everforest (light/dark medium)'
	},
	{
		dark: {
			base0A: '#f9e2af',
			base0B: '#a6e3a1',
			base0C: '#94e2d5',
			base0D: '#89b4fa',
			base0E: '#cba6f7',
			base0F: '#f2cdcd',
			base00: '#1e1e2e',
			base01: '#181825',
			base02: '#313244',
			base03: '#45475a',
			base04: '#585b70',
			base05: '#cdd6f4',
			base06: '#f5e0dc',
			base07: '#b4befe',
			base08: '#f38ba8',
			base09: '#fab387'
		},
		key: 'd',
		light: {
			base0A: '#df8e1d',
			base0B: '#40a02b',
			base0C: '#179299',
			base0D: '#1e66f5',
			base0E: '#8839ef',
			base0F: '#dd7878',
			base00: '#eff1f5',
			base01: '#e6e9ef',
			base02: '#ccd0da',
			base03: '#bcc0cc',
			base04: '#acb0be',
			base05: '#4c4f69',
			base06: '#dc8a78',
			base07: '#7287fd',
			base08: '#d20f39',
			base09: '#fe640b'
		},
		name: 'Catppuccin (latte/mocha)'
	},
	{
		dark: {
			base0A: '#d8a657',
			base0B: '#a9b665',
			base0C: '#89b482',
			base0D: '#7daea3',
			base0E: '#d3869b',
			base0F: '#bd6f3e',
			base00: '#292828',
			base01: '#32302f',
			base02: '#504945',
			base03: '#665c54',
			base04: '#bdae93',
			base05: '#ddc7a1',
			base06: '#ebdbb2',
			base07: '#fbf1c7',
			base08: '#ea6962',
			base09: '#e78a4e'
		},
		key: 'e',
		light: {
			base0A: '#b47109',
			base0B: '#6c782e',
			base0C: '#4c7a5d',
			base0D: '#45707a',
			base0E: '#945e80',
			base0F: '#e78a4e',
			base00: '#fbf1c7',
			base01: '#f2e5bc',
			base02: '#d5c4a1',
			base03: '#bdae93',
			base04: '#665c54',
			base05: '#654735',
			base06: '#3c3836',
			base07: '#282828',
			base08: '#c14a4a',
			base09: '#c35e0a'
		},
		name: 'Gruvbox Material (light/dark medium)'
	}
];
