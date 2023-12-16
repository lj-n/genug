import { defineConfig, presetUno } from 'unocss';
import extractorSvelte from '@unocss/extractor-svelte';
import transformerVariantGroup from '@unocss/transformer-variant-group';

export default defineConfig({
	transformers: [transformerVariantGroup()],
	extractors: [extractorSvelte()],
	content: {
		filesystem: ['./src/app.html']

	},
	presets: [presetUno({ preflight: true })],
	theme: {
		fontFamily: {
			'open-sans': "'Open Sans'"
		},
		colors: {
			base: {
				white: '#fffcf0',
				50: '#f2f0e5',
				100: '#e6e4d9',
				150: '#dad8ce',
				200: '#cecdc3',
				300: '#b7b5ac',
				500: '#878580',
				600: '#6f6e69',
				700: '#575653',
				800: '#403e3c',
				850: '#343331',
				900: '#282726',
				950: '#1c1b1a',
				black: '#100f0f'
			},
			ui: {
				normal: {
					DEFAULT: '#E6E4D9',
					dark: '#282726'
				},
				hover: {
					DEFAULT: '#DAD8CE',
					dark: '#343331'
				},
				active: {
					DEFAULT: '#CECDC3',
					dark: '#403E3C'
				}
			},
			red: {
				DEFAULT: '#af3029',
				dark: '#d14d41'
			},
			orange: {
				DEFAULT: '#bc5215',
				dark: '#da702c'
			},
			yellow: {
				DEFAULT: '#ad8301',
				dark: '#d0a215'
			},
			green: {
				DEFAULT: '#66800b',
				dark: '#879a39'
			},
			cyan: {
				DEFAULT: '#24837b',
				dark: '#3aa99f'
			},
			blue: {
				DEFAULT: '#205ea6',
				dark: '#4385be'
			},
			purple: {
				DEFAULT: '#5e409d',
				dark: '#8b7ec8'
			},
			magenta: {
				DEFAULT: '#a02f6f',
				dark: '#ce5d97'
			}
		}
	},
	rules: [
		[
			'squircle',
			{
				'mask-size': 'contain',
				'mask-repeat': 'no-repeat',
				'mask-position': 'center',
				'mask-image': `url("data:image/svg+xml,%3csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M100 0C20 0 0 20 0 100s20 100 100 100 100-20 100-100S180 0 100 0Z'/%3e%3c/svg%3e")`
			}
		],

		[
			/^shadow-block-(\d+)$/,
			([, d]) => ({
				'--un-shadow': `${d}px ${d}px var(--un-shadow-color)`,
				'box-shadow':
					'var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow)'
			})
		]
	],
	shortcuts: [
		{
			'text-normal': 'text-base-black dark:text-base-200',
			'text-muted': 'text-base-600 dark:text-base-500',
			'text-faint': 'text-base-300 dark:text-base-700',
			'text-error': 'text-red dark:text-red-dark',
			bg: 'bg-base-white dark:bg-base-black',
			fg: 'bg-base-50 dark:bg-base-950',
			link: 'text-normal decoration-wavy decoration-base-black dark:decoration-base-200 hover:underline',
			btn: `
				py-2 px-4 rounded-xl
				flex items-center justify-center gap-2
				w-fit h-fit font-semibold text-normal cursor-pointer
				transition-all duration-150
				translate-0 hover:-translate-2px
				border-(1 ui-normal) hover:border-ui-hover dark:(border-ui-normal-dark hover:border-ui-hover-dark)
				shadow-(block-0 ui-hover) hover:shadow-block-4 dark:shadow-ui-hover-dark
				active:(translate-0 shadow-block-0)
				data-[loading]:hover:(translate-0 shadow-block-0 border-ui-normal cursor-wait)
				disabled:(fg text-muted translate-0 shadow-block-0 border-ui-normal cursor-not-allowed)
			`,
			'btn-sm': 'text-sm py-1 px-2',
			'input-label': 'flex flex-col w-full text-normal',
			input: `
				border-(1 ui-normal) p-2 text-base text-inherit bg rounded-xl w-full 
				dark:(border-ui-normal-dark) hover:focus:border-ui-hover placeholder:text-muted
			`,
			avatar:
				'aspect-square squircle [&>img]:(w-full h-full object-cover bg-no-repeat bg-center fg)',
			info: `
				flex items-center border border-ui-normal px-4 py-2 w-fit rounded text-xs overflow-hidden relative h-fit
				after:(content-[''] absolute h-full w-2 bg-ui-normal left-0 top-0) after:absolute
				dark:(border-ui-normal-dark after:bg-ui-normal-dark)
			`
		},
		[
			/^btn-(.*)$/,
			([, c], { theme }) => {
				if (theme.colors && Object.keys(theme.colors).includes(c)) {
					return `
						shadow-${c} text-${c} hover:border-${c} dark:(shadow-${c}-dark text-${c}-dark hover:border-${c}-dark)
						disabled:(bg-ui-normal shadow-block-0 text-muted hover:border-ui-normal cursor-not-allowed)
					`;
				}
			}
		],
		[
			/^info-(.*)$/,
			([, c], { theme }) => {
				if (theme.colors && Object.keys(theme.colors).includes(c)) {
					return `
						border-${c} dark:border-${c}-dark after:bg-${c} dark:after:bg-${c}-dark 
						[&>svg]:text-${c} dark:[&>svg]:text-${c}-dark
					`;
				}
			}
		]
	]
});
