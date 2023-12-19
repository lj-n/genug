import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';
import UnoCSS from 'unocss/vite';

export default defineConfig({
	plugins: [
		/** Disable unocss plugin for tests https://github.com/vitest-dev/vitest/issues/2008 */
		process.env.NODE_ENV !== 'test' && UnoCSS(),
		sveltekit()
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/testing'],
		pool: 'forks'
	},
	css: {
		transformer: 'lightningcss',
		lightningcss: { targets: browserslistToTargets(browserslist('>= 0.25%')) }
	},
	build: {
		cssMinify: 'lightningcss'
	}
});
