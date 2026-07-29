import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import Fixture from './responsive-modal.test-fixture.svelte';

// jsdom has no matchMedia; report "below the desktop breakpoint" so the shell
// renders its Drawer variant — the branch where vaul's dismissible={false}
// used to swallow every close path.
beforeAll(() => {
	window.matchMedia = (query: string) =>
		({
			addEventListener: () => {},
			matches: false,
			media: query,
			removeEventListener: () => {}
		}) as unknown as MediaQueryList;
});

// Opening the modal makes the primitive lock body scroll; unmounting schedules a
// delayed cleanup that touches `document.body`. Unmount eagerly and wait past
// the delay so the cleanup runs while document is alive.
afterEach(async () => {
	cleanup();
	await new Promise((resolve) => setTimeout(resolve, 50));
});

describe('ResponsiveModal drawer variant — dismissible={false}', () => {
	it('closes via the Close button', async () => {
		render(Fixture, { props: { dismissible: false, open: true } });

		const closeButton = await screen.findByRole('button', { name: 'Close' });
		await fireEvent.click(closeButton);

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('closes via Escape, matching the Dialog variant', async () => {
		render(Fixture, { props: { dismissible: false, open: true } });

		const drawer = await screen.findByRole('dialog');
		await fireEvent.keyDown(drawer, { key: 'Escape' });

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});
});

describe('ResponsiveModal drawer variant — dismissible (default)', () => {
	it('still closes via the Close button', async () => {
		render(Fixture, { props: { open: true } });

		const closeButton = await screen.findByRole('button', { name: 'Close' });
		await fireEvent.click(closeButton);

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});
});
