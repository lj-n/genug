/**
 * Captures the README screenshots end-to-end (issue #112 / #122): point a
 * throwaway SQLite file at a fresh build, seed the demo fixture, boot the
 * production server, log in, and screenshot the budget month view (the hero)
 * and an account's transactions.
 *
 * Not CI-gated — reproducibility is the kept-current mechanism. Rerun with
 * `npm run screenshots` after notable UI changes and commit the PNGs
 * (see docs/dev/screenshots.md).
 */
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = Number(process.env.SCREENSHOT_PORT ?? 4319);
const ORIGIN = `http://localhost:${PORT}`;
const OUT_DIR = 'docs/screenshots';
const VIEWPORT = { height: 900, width: 1440 } as const;

async function main(): Promise<void> {
	const tmp = mkdtempSync(join(tmpdir(), 'genug-screenshots-'));
	const databaseUrl = join(tmp, 'fixture.db');

	console.log('Building the app…');
	execFileSync('npm', ['run', 'build'], {
		env: { ...process.env, DATABASE_URL: ':memory:' },
		stdio: 'inherit'
	});

	console.log('Seeding the demo fixture…');
	// Set DATABASE_URL before importing the seed: `$db` opens it at module load.
	process.env.DATABASE_URL = databaseUrl;
	const { seedFixture } = await import('./seed.ts');
	const fixture = await seedFixture();

	console.log('Booting the server…');
	const server = spawn('node', ['build'], {
		env: { ...process.env, DATABASE_URL: databaseUrl, ORIGIN, PORT: String(PORT) },
		stdio: 'inherit'
	});

	const browser = await chromium.launch();
	try {
		await waitForServer(`${ORIGIN}/login`);

		mkdirSync(OUT_DIR, { recursive: true });
		const page = await browser.newPage({ reducedMotion: 'reduce', viewport: VIEWPORT });

		await page.goto(`${ORIGIN}/login`);
		await page.getByLabel('Username').fill(fixture.username);
		await page.getByLabel('Password').fill(fixture.password);
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL((url) => !url.pathname.startsWith('/login'));

		const capture = async (name: string) => {
			// Park the pointer and drop focus so no hover outline or focus ring
			// (e.g. on a budget cell under the last click position) leaks into the
			// screenshot — it should show a clean, at-rest view.
			await page.mouse.move(0, 0);
			await page.evaluate(() => {
				if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
			});
			await page.screenshot({ path: join(OUT_DIR, name) });
		};

		console.log('Capturing the budget month view…');
		await page.goto(`${ORIGIN}/${fixture.budgetId}/${fixture.month}`);
		await page.getByRole('heading', { name: 'Household' }).waitFor();
		await page.getByText('Rent').first().waitFor();
		await capture('budget.png');

		console.log('Capturing the transactions view…');
		await page.goto(`${ORIGIN}/${fixture.budgetId}/accounts/${fixture.checkingAccountId}`);
		await page.getByRole('heading', { name: 'Checking' }).waitFor();
		await page.getByText('Supermarket').first().waitFor();
		await capture('transactions.png');

		console.log(`Wrote screenshots to ${OUT_DIR}/`);
	} finally {
		await browser.close();
		server.kill();
		rmSync(tmp, { force: true, recursive: true });
	}
}

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(url);
			if (response.ok || response.status === 404) return;
		} catch {
			// Server not up yet — keep polling.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

await main();
