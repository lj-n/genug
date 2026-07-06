import { defineConfig, devices } from '@playwright/test';

const DEFAULT_VIEWPORT = { height: 900, width: 1440 } as const;

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

	retries: 0,

	testDir: 'tests/playwright',

	use: {
		contextOptions: { reducedMotion: 'reduce' },
		trace: 'on-first-retry',
		viewport: DEFAULT_VIEWPORT
	},

	webServer: {
		command:
			'DATABASE_URL=:memory: npm run build && DATABASE_URL=:memory: ORIGIN=http://localhost:3000 node build',
		port: 3000
	}
});
