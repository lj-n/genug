import { defineConfig, devices } from '@playwright/test';

const DEFAULT_VIEWPORT = { height: 900, width: 1440 } as const;

// The dev server port is configurable so parallel worktrees can run the e2e
// suite against isolated servers/databases instead of colliding on one port.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	expect: {
		timeout: 10000
	},

	fullyParallel: true,

	outputDir: 'tests/playwright/results',

	projects: [
		{
			name: 'setup',
			testMatch: /global\.setup\.ts/
		},
		{
			dependencies: ['setup'],
			name: 'tablet',
			use: { ...devices['iPad Mini landscape'] }
		},
		{
			dependencies: ['setup'],
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], viewport: DEFAULT_VIEWPORT }
		}
	],

	reporter: process.env.CI ? 'blob' : 'list',

	// One retry in CI: a genuine failure still fails, a one-off timing flake is
	// reported as "flaky" instead of red — and the retry records a full trace
	// (trace: 'on-first-retry') for diagnosis.
	retries: process.env.CI ? 1 : 0,

	testDir: 'tests/playwright',

	use: {
		baseURL: ORIGIN,
		contextOptions: { reducedMotion: 'reduce' },
		trace: 'on-first-retry',
		viewport: DEFAULT_VIEWPORT
	},

	webServer: {
		command: `DATABASE_URL=:memory: npm run build && DATABASE_URL=:memory: ORIGIN=${ORIGIN} PORT=${PORT} node build`,
		port: PORT,
		// pino logs (request logs, unhandled server errors incl. logId) go to
		// stdout, which Playwright discards by default — keep them visible so a
		// 500 during a test can be traced to its server-side error.
		stdout: 'pipe'
	}
});
