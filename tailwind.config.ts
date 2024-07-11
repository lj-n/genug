import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				red: {
					DEFAULT: 'hsl(var(--flexoki-red-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-red-400) / <alpha-value>)'
				},
				orange: {
					DEFAULT: 'hsl(var(--flexoki-orange-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-orange-400) / <alpha-value>)'
				},
				yellow: {
					DEFAULT: 'hsl(var(--flexoki-yellow-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-yellow-400) / <alpha-value>)'
				},
				green: {
					DEFAULT: 'hsl(var(--flexoki-green-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-green-400) / <alpha-value>)'
				},
				cyan: {
					DEFAULT: 'hsl(var(--flexoki-cyan-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-cyan-400) / <alpha-value>)'
				},
				blue: {
					DEFAULT: 'hsl(var(--flexoki-blue-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-blue-400) / <alpha-value>)'
				},
				purple: {
					DEFAULT: 'hsl(var(--flexoki-purple-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-purple-400) / <alpha-value>)'
				},
				magenta: {
					DEFAULT: 'hsl(var(--flexoki-magenta-600) / <alpha-value>)',
					light: 'hsl(var(--flexoki-magenta-400) / <alpha-value>)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Open Sans']
			}
		}
	},
	plugins: [
		plugin(({ addComponents }) => {
			addComponents({
				'.squircle': {
					'aspect-ratio': '1 / 1',
					'mask-size': 'contain',
					'mask-repeat': 'no-repeat',
					'mask-position': 'center',
					'mask-image': `url("data:image/svg+xml,%3csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M100 0C20 0 0 20 0 100s20 100 100 100 100-20 100-100S180 0 100 0Z'/%3e%3c/svg%3e")`
				}
			});
		})
	]
};

export default config;
