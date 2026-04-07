/// <reference types="vitest/config" />
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	define: { 'import.meta.vitest': 'undefined' },
	plugins: [
		tailwindcss(),
		sveltekit(),
		Icons({ compiler: 'svelte' }),
		paraglideVitePlugin({
			outdir: './src/lib/paraglide',
			project: './project.inlang',
			strategy: ['cookie', 'baseLocale']
		})
	],
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined,
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		includeSource: ['src/**/*.{js,ts}'],
		setupFiles: ['src/test/setup.ts']
	}
});
