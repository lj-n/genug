/// <reference types="vitest/config" />
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

if (process.env.VITEST) {
	process.env.DATABASE_URL = ':memory:';
}

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
		coverage: {
			// Scoped floor: gate the server data layer where access control and
			// persistence rules live. Boilerplate and generated code are excluded.
			exclude: [
				'src/lib/server/db/tables/**',
				'src/lib/server/db/relations.ts',
				'src/lib/server/db/create-database.ts',
				'src/lib/server/db/migrations/**',
				'src/lib/server/db/index.ts',
				'src/lib/server/db/user-context/index.ts'
			],
			include: ['src/lib/server/db/**'],
			provider: 'v8',
			reporter: ['text', 'html'],
			// 100% lines + functions on the guarded modules; branches reported, not gated.
			thresholds: {
				'src/lib/server/db/auth/**': { functions: 100, lines: 100 },
				'src/lib/server/db/user-context/**': { functions: 100, lines: 100 }
			}
		},
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		includeSource: ['src/**/*.{js,ts}'],
		pool: 'forks',
		setupFiles: ['src/test/setup.ts']
	}
});
