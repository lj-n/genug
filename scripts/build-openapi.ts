/**
 * Assemble `docs/api/openapi.yaml` from the hand-authored contract plus the
 * valibot-derived request schemas (map #190, ticket #194).
 *
 * The derivation imports the valibot schemas in `src/lib/schemas/`, which pull
 * in `$lib` aliases and Paraglide messages — neither resolvable by plain Node.
 * So we load the assembler through Vite's own module runner (`ssrLoadModule`),
 * which applies the SvelteKit aliases and the Paraglide plugin exactly as the
 * app and the vitest suite do. No extra runner dependency needed.
 *
 * Run with: npm run api:generate
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const server = await createServer({
	appType: 'custom',
	configFile: resolve(root, 'vite.config.ts'),
	logLevel: 'warn',
	// We SSR-load a single server module; skip the browser dependency scan so it
	// can't race `server.close()` and spew "request is outdated" noise.
	optimizeDeps: { noDiscovery: true },
	root,
	server: { middlewareMode: true }
});

try {
	const { renderOpenApiYaml } = (await server.ssrLoadModule(
		'/src/lib/server/api/openapi.ts'
	)) as typeof import('../src/lib/server/api/openapi');

	const outPath = resolve(root, 'docs/api/openapi.yaml');
	writeFileSync(outPath, renderOpenApiYaml());
	console.log(`Wrote ${outPath}`);
} finally {
	await server.close();
}
