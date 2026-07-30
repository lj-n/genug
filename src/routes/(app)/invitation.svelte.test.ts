import { m } from '$lib/paraglide/messages';
import { toasts } from '$lib/utils/anchored-toast.svelte';
import { cleanup, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const remote = vi.hoisted(() => {
	/**
	 * A remote-form double: `enhance` plays submits through the component's
	 * lifecycle, `fields` serves the template's field accessors, and every query
	 * handed to `submit().updates(...)` is recorded in `updatedQueries` so a test
	 * can assert which caches the mutation refreshes.
	 */
	function makeForm(fieldNames: readonly string[]) {
		const updatedQueries: unknown[] = [];

		const field = (name: string): Record<string, unknown> => ({
			as: (type: string, value?: unknown) => ({ name, type, value })
		});

		const form = {
			enhance: (callback: (instance: unknown) => Promise<void>) => ({
				onsubmit: (event: SubmitEvent) => {
					event.preventDefault();
					void callback({
						element: event.target as HTMLFormElement,
						submit: () => {
							const promise = Promise.resolve(true) as Promise<boolean> & {
								updates: (...queries: unknown[]) => Promise<boolean>;
							};
							promise.updates = (...queries: unknown[]) => {
								updatedQueries.push(...queries);
								return promise;
							};
							return promise;
						}
					});
				}
			}),
			fields: Object.fromEntries(fieldNames.map((name) => [name, field(name)])),
			pending: 0
		};

		return { form, updatedQueries };
	}

	// Distinct sentinels so a test can tell the invitation list refresh apart
	// from the budget list refresh in the recorded `updates(...)` arguments.
	const invitationsQuery = { query: 'getInvitations' };
	const budgetsQuery = { query: 'getBudgets' };

	return {
		acceptForm: makeForm(['budgetId', 'userId']),
		budgetsQuery,
		getBudgets: vi.fn(() => budgetsQuery),
		getInvitations: vi.fn(() => invitationsQuery),
		invitationsQuery,
		removeForm: makeForm(['budgetId', 'userId'])
	};
});

vi.mock('$lib/remote-functions/budget.remote', () => ({
	acceptInvite: remote.acceptForm.form,
	getBudgets: remote.getBudgets,
	getInvitations: remote.getInvitations,
	removeUser: remote.removeForm.form
}));
vi.mock('$lib/remote-functions/user.remote', () => ({
	getUser: vi.fn(async () => ({ id: 'user-1' }))
}));

import Invitation from './invitation.svelte';

// The modal renders as a Dialog above the desktop breakpoint; jsdom has no
// matchMedia, so report "desktop" to exercise the Dialog variant.
beforeAll(() => {
	window.matchMedia = (query: string) =>
		({
			addEventListener: () => {},
			matches: true,
			media: query,
			removeEventListener: () => {}
		}) as unknown as MediaQueryList;

	// jsdom lacks the Web Animations API the dialog's exit transition calls into;
	// resolve `onfinish` immediately so closing outros settle.
	Element.prototype.animate ??= function () {
		const animation = { cancel() {}, finished: Promise.resolve() };
		Object.defineProperty(animation, 'onfinish', {
			configurable: true,
			set: (cb: () => void) => queueMicrotask(cb)
		});
		return animation as unknown as Animation;
	};
});

// Opening the modal makes bits-ui lock body scroll; unmounting schedules a
// delayed cleanup that touches `document.body`. Unmount eagerly and wait past
// the delay so the cleanup runs while document is alive.
afterEach(async () => {
	[...toasts].forEach((toast) => toast.dismiss());
	cleanup();
	await new Promise((resolve) => setTimeout(resolve, 50));
});

const invitation = {
	budgetId: 'budget-1',
	budgetName: 'Household',
	inviterName: 'alice'
};

async function openModal() {
	remote.acceptForm.updatedQueries.length = 0;
	remote.removeForm.updatedQueries.length = 0;
	remote.getInvitations.mockClear();
	remote.getBudgets.mockClear();

	render(Invitation, { props: { invitation } });

	const trigger = await screen.findByRole('button', { name: m.invitation_button_label() });
	await userEvent.click(trigger);
	await screen.findByRole('button', { name: m.invitation_accept_button() });
}

describe('Invitation — cache refresh wiring', () => {
	it('refreshes the invitation list and budget list when accepting', async () => {
		await openModal();

		await userEvent.click(screen.getByRole('button', { name: m.invitation_accept_button() }));

		await waitFor(() =>
			expect(remote.acceptForm.updatedQueries).toContain(remote.invitationsQuery)
		);
		// The newly-joined budget must appear in the nav without a reload, so the
		// budget list refreshes alongside the invitation indicator.
		expect(remote.acceptForm.updatedQueries).toContain(remote.budgetsQuery);
	});

	it('refreshes the invitation list when declining', async () => {
		await openModal();

		await userEvent.click(screen.getByRole('button', { name: m.invitation_decline_button() }));

		const confirm = await screen.findByRole('alertdialog');
		await userEvent.click(
			within(confirm).getByRole('button', { name: m.invitation_decline_confirm_action() })
		);

		await waitFor(() =>
			expect(remote.removeForm.updatedQueries).toContain(remote.invitationsQuery)
		);
		// Declining only clears the indicator; it never touches the budget list.
		expect(remote.removeForm.updatedQueries).not.toContain(remote.budgetsQuery);
	});
});
