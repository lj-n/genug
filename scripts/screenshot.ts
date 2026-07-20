/**
 * Captures the documentation screenshots end-to-end (issue #112 / #122): point
 * a throwaway SQLite file at a fresh build, seed the demo fixture, boot the
 * production server, log in, and screenshot the budget month view (the hero),
 * an account's transactions, and the Unassigned breakdown popover.
 *
 * Not CI-gated — reproducibility is the kept-current mechanism. Rerun with
 * `npm run screenshots` after notable UI changes and commit the PNGs
 * (see docs/dev/screenshots.md).
 */
import { THEME_COOKIE_NAME } from '$lib/utils/theme';
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
		const context = await browser.newContext({ reducedMotion: 'reduce', viewport: VIEWPORT });
		const page = await context.newPage();

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

		// The two README shots are captured in both themes (issue #235): the
		// light variant first, then the same views forced dark. Both go through
		// the same navigation so only the theme differs between the pair.
		const captureBudget = async (name: string) => {
			await page.goto(`${ORIGIN}/${fixture.budgetId}/${fixture.month}`);
			await page.getByRole('heading', { name: 'Household' }).waitFor();
			await page.getByText('Rent').first().waitFor();
			await capture(name);
		};
		const captureTransactions = async (name: string) => {
			await page.goto(`${ORIGIN}/${fixture.budgetId}/accounts/${fixture.checkingAccountId}`);
			await page.getByRole('heading', { name: 'Checking' }).waitFor();
			await page.getByText('Supermarket').first().waitFor();
			await capture(name);
		};

		console.log('Capturing the budget month view…');
		await captureBudget('budget.png');

		console.log('Capturing the transactions view…');
		await captureTransactions('transactions.png');

		console.log('Capturing the Unassigned breakdown popover…');
		// The popover is a small element (~380 CSS px), so a 1× element shot looks
		// soft once embedded near that width. Capture it in its own context at 2×
		// device scale for a crisp image, reusing the logged-in session so we skip
		// a second login. It needs a bespoke path anyway: the popover must stay
		// open, but the shared `capture()` helper blurs focus (dismissing it) and
		// shoots the full viewport.
		const hidpi = await browser.newContext({
			deviceScaleFactor: 2,
			reducedMotion: 'reduce',
			storageState: await context.storageState(),
			viewport: VIEWPORT
		});
		const hidpiPage = await hidpi.newPage();
		await hidpiPage.goto(`${ORIGIN}/${fixture.budgetId}/${fixture.month}`);
		await hidpiPage.getByRole('heading', { name: 'Household' }).waitFor();
		await hidpiPage.getByRole('button', { name: 'Explain the unallocated amount' }).click();
		const popover = hidpiPage.locator('[data-slot="popover-content"]');
		await popover.getByText('Reserved').waitFor();
		// `.screenshot()` waits for the open transition to settle first.
		await popover.screenshot({ path: join(OUT_DIR, 'unassigned.png') });
		const box = await popover.boundingBox();
		console.log(`Popover CSS width: ${box?.width}px (embed at ~this width so 2× stays crisp)`);
		await hidpi.close();

		// Dark-theme companions for the README <picture> sources, captured last
		// so the forced-dark cookie never leaks into the storageState the hidpi
		// popover context copies above. The `theme` cookie forces an explicit
		// override that wins over the OS `prefers-color-scheme` (ADR-0010); the
		// server stamps `.dark` on `<html>` on the next navigation, so a fresh
		// goto renders dark.
		console.log('Capturing the dark-theme companions…');
		await context.addCookies([{ name: THEME_COOKIE_NAME, url: ORIGIN, value: 'dark' }]);
		await captureBudget('budget-dark.png');
		await captureTransactions('transactions-dark.png');

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
