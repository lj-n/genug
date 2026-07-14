import adapter from '@sveltejs/adapter-node';
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Version surfaced to the app via `$app/environment`. Prod (version-tag) builds
// leave BUILD_SHA unset and show the clean CalVer; stage (main-push) builds pass
// the short SHA and show a dev-flavoured `<version>-dev+<sha>` (ADR-0012).
const buildSha = process.env.BUILD_SHA;
const versionName = buildSha ? `${version}-dev+${buildSha}` : version;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		experimental: {
			async: true
		},

		// defaults to rune mode for the project, execept for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		adapter: adapter(),

		alias: {
			$db: 'src/lib/server/db',
			$server: 'src/lib/server'
		},

		experimental: {
			remoteFunctions: true
		},

		version: {
			name: versionName
		}
	}
};

export default config;
