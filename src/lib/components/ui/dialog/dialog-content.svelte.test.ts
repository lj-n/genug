import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Fixture from './dialog-content.test-fixture.svelte';

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
	vi.runAllTimers();
	vi.useRealTimers();
});

describe('DialogContent — open auto-focus (#433)', () => {
	it('moves focus into the dialog when nothing inside it has focus yet', async () => {
		render(Fixture);
		const dialog = await screen.findByRole('dialog');

		await vi.runAllTimersAsync();

		expect(dialog).toHaveFocus();
	});

	it('leaves focus on a field the user already focused', async () => {
		render(Fixture);
		const amount = await screen.findByRole('textbox', { name: 'Amount' });

		// The open auto-focus is deferred to a timer; a user (or a fast test
		// driver) can reach a field first. Typing would land in the dialog body
		// instead of the field if the timer then stole focus.
		amount.focus();
		await vi.runAllTimersAsync();

		expect(amount).toHaveFocus();
	});
});
