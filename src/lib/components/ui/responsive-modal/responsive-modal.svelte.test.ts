import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
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

describe('ResponsiveModal — breakpoint flip while open', () => {
	// A controllable matchMedia so a test can flip the query mid-render, the way a
	// phone rotation crosses the 640px boundary. Returns one MediaQueryList per
	// call whose `matches` the test can toggle and then notify listeners about.
	function installMatchMedia(initialMatches: boolean) {
		let matches = initialMatches;
		const listeners = new Set<() => void>();

		window.matchMedia = ((media: string) =>
			({
				addEventListener: (_: string, cb: () => void) => listeners.add(cb),
				get matches() {
					return matches;
				},
				media,
				removeEventListener: (_: string, cb: () => void) => listeners.delete(cb)
			}) as unknown as MediaQueryList) as typeof window.matchMedia;

		return {
			flip(next: boolean) {
				matches = next;
				listeners.forEach((cb) => cb());
			}
		};
	}

	it('keeps typed form state when the viewport crosses the breakpoint', async () => {
		// Open below the breakpoint (Drawer variant).
		const mql = installMatchMedia(false);
		render(Fixture, { props: { open: true } });

		const input = (await screen.findByLabelText('Name')) as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'Household EDITED' } });
		expect(input.value).toBe('Household EDITED');

		// Rotate to landscape: the query now matches the desktop breakpoint.
		await fireEvent(window, new Event('resize'));
		mql.flip(true);
		await tick();

		// The modal stays open and the slotted content is not remounted, so the
		// typed value survives the drawer↔dialog swap (#363).
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Household EDITED');
	});

	it('keeps typed form state crossing the breakpoint the other way', async () => {
		// Open above the breakpoint (Dialog variant), then rotate to portrait.
		const mql = installMatchMedia(true);
		render(Fixture, { props: { open: true } });

		const input = (await screen.findByLabelText('Name')) as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'Household EDITED' } });

		await fireEvent(window, new Event('resize'));
		mql.flip(false);
		await tick();

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Household EDITED');
	});
});
