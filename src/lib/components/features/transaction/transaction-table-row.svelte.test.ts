import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { m } from '$lib/paraglide/messages';
import { toasts } from '$lib/utils/anchored-toast.svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const remote = vi.hoisted(() => {
	type Issue = { message: string; path: (number | string)[] };

	/**
	 * A remote-form double: `enhance` plays submits through the component's
	 * lifecycle, `fields` serves the template's field accessors. The submit
	 * result is a thunk so a rejection is only created once the lifecycle
	 * awaits it — otherwise vitest reports it as unhandled.
	 */
	function makeForm(fieldNames: readonly string[]) {
		let fieldState: Record<string, unknown> = {};
		let submitResult: () => Promise<unknown> = () => Promise.resolve(true);
		let allIssuesState: Issue[] | undefined;
		const onSubmit = vi.fn();
		const updatedQueries: unknown[] = [];

		const field = (name: string): Record<string, unknown> =>
			new Proxy(
				{
					as: (type: string, value?: unknown) => {
						if (type === 'hidden') return { name, type, value };
						if (type === 'checkbox') return { checked: value, name, type };
						if (type === 'text') return { name, type, value };
						return { name };
					},
					issues: () => undefined,
					set: (value: unknown) => {
						fieldState[name] = value;
					},
					value: () => fieldState[name]
				},
				{
					// Mirror SvelteKit's field proxy: numeric index yields the
					// nested array-element accessor (e.g. `fields.ids[0]`).
					get(target, prop) {
						if (typeof prop === 'string' && /^\d+$/.test(prop)) {
							return field(`${name}[${prop}]`);
						}
						return Reflect.get(target, prop);
					}
				}
			);

		const form = {
			enhance: (callback: (instance: unknown) => Promise<void>) => ({
				onsubmit: (event: SubmitEvent) => {
					event.preventDefault();
					onSubmit();
					void callback({
						element: event.target as HTMLFormElement,
						submit: () => {
							const promise = submitResult() as Promise<unknown> & {
								updates: (...queries: unknown[]) => Promise<unknown>;
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
			fields: Object.assign(
				{ allIssues: () => allIssuesState },
				Object.fromEntries(fieldNames.map((name) => [name, field(name)]))
			),
			pending: 0
		};

		return {
			form,
			onSubmit,
			reset: () => {
				fieldState = {};
				submitResult = () => Promise.resolve(true);
				allIssuesState = undefined;
				updatedQueries.length = 0;
				onSubmit.mockClear();
				form.pending = 0;
			},
			setAllIssues: (issues: Issue[]) => {
				allIssuesState = issues;
			},
			setSubmitResult: (result: () => Promise<unknown>) => {
				submitResult = result;
			},
			updatedQueries
		};
	}

	const editForm = makeForm([
		'accountId',
		'transactionId',
		'categoryId',
		'notes',
		'date',
		'amount',
		'validated'
	]);
	const deleteForm = makeForm(['ids']);

	return {
		deleteForm,
		editForm,
		getAccount: vi.fn(),
		getAccountBalances: vi.fn(),
		getCategories: vi.fn(async () => [
			{ id: 'category-1', name: 'Groceries' },
			{ id: 'category-2', name: 'Rent' }
		]),
		listTransactions: vi.fn()
	};
});

vi.mock('$lib/remote-functions/transaction.remote', () => ({
	batchDeleteTransactions: { for: () => remote.deleteForm.form },
	editTransaction: { for: () => remote.editForm.form },
	listTransactions: remote.listTransactions
}));
vi.mock('$lib/remote-functions/account.remote', () => ({
	getAccount: remote.getAccount,
	getAccountBalances: remote.getAccountBalances
}));
vi.mock('$lib/remote-functions/category.remote', () => ({ getCategories: remote.getCategories }));

import TableRow from './transaction-table-row.svelte';

const transaction: ListTransaction = {
	accountId: 'account-1',
	amount: 4200,
	budgetId: 'budget-1',
	categoryId: 'category-1',
	categoryName: 'Groceries',
	counterpartAccountId: null,
	counterpartAccountName: null,
	createdAt: new Date('2026-07-01T00:00:00Z'),
	createdBy: 'user-1',
	createdByName: 'user',
	date: '2026-07-01',
	id: 'tx-1',
	notes: 'weekly shop',
	transferId: null,
	validated: false
};

afterEach(() => {
	[...toasts].forEach((toast) => toast.dismiss());
});

async function renderRow(configure?: () => void) {
	remote.editForm.reset();
	remote.deleteForm.reset();
	configure?.();
	const cancelEditing = vi.fn();
	const setEditing = vi.fn();
	const utils = render(TableRow, {
		props: {
			budgetId: 'budget-1',
			cancelEditing,
			currency: 'EUR',
			isEditing: true,
			setEditing,
			transaction
		}
	});
	await screen.findByRole('row');
	return { ...utils, cancelEditing, setEditing };
}

const saveButton = () => screen.getByRole('button', { name: 'Save' });
const cancelButton = () => screen.getByRole('button', { name: 'Cancel' });
const deleteButton = () => screen.getByRole('button', { name: 'Delete' });

describe('TransactionTableRow (edit mode) — submit lifecycle', () => {
	it('saves the row and exits edit mode on success', async () => {
		const user = userEvent.setup();
		const { cancelEditing } = await renderRow();

		await user.click(saveButton());

		expect(remote.editForm.onSubmit).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(cancelEditing).toHaveBeenCalledTimes(1));
	});

	it('chains the transaction list and account-balance refreshes into the submit', async () => {
		const user = userEvent.setup();
		await renderRow();

		await user.click(saveButton());

		await waitFor(() => expect(remote.editForm.updatedQueries).toContain(remote.listTransactions));
		// The account's total (getAccount) and validated/pending split
		// (getAccountBalances) go stale with the register, so both refresh too.
		expect(remote.getAccount).toHaveBeenCalledWith(transaction.accountId);
		expect(remote.getAccountBalances).toHaveBeenCalledWith(transaction.accountId);
	});

	it('stays in edit mode when the submit reports validation issues', async () => {
		const user = userEvent.setup();
		const { cancelEditing } = await renderRow();
		remote.editForm.setSubmitResult(() => Promise.resolve(false));

		await user.click(saveButton());

		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(cancelEditing).not.toHaveBeenCalled();
	});

	it('surfaces a thrown save error as an anchored error toast and stays in edit mode', async () => {
		const user = userEvent.setup();
		const { cancelEditing } = await renderRow();
		remote.editForm.setSubmitResult(() => Promise.reject(new Error('better-sqlite3 exploded')));

		await user.click(saveButton());

		await waitFor(() => expect(toasts).toHaveLength(1));
		expect(toasts[0].variant).toBe('error');
		expect(toasts[0].message).toBe(m.form_error_unexpected());
		expect(cancelEditing).not.toHaveBeenCalled();
		expect(screen.queryByText(/better-sqlite3/)).not.toBeInTheDocument();
	});
});

describe('TransactionTableRow (edit mode) — shared error line', () => {
	it('shows all field issues in one shared error line', async () => {
		await renderRow(() =>
			remote.editForm.setAllIssues([
				{ message: 'Amount must not be zero', path: ['amount'] },
				{ message: 'Invalid date', path: ['date'] }
			])
		);

		const alerts = screen.getAllByRole('alert');
		expect(alerts).toHaveLength(1);
		expect(alerts[0]).toHaveTextContent('Amount must not be zero');
		expect(alerts[0]).toHaveTextContent('Invalid date');
	});

	it('renders no error line without issues', async () => {
		await renderRow();

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});

describe('TransactionTableRow (edit mode) — delete', () => {
	it('submits the row id under the ids field through the hidden delete form', async () => {
		const user = userEvent.setup();
		await renderRow();

		expect(deleteButton()).toHaveAttribute('name', 'ids[0]');
		expect(deleteButton()).toHaveValue('tx-1');

		await user.click(deleteButton());

		expect(remote.deleteForm.onSubmit).toHaveBeenCalledTimes(1);
		expect(remote.editForm.onSubmit).not.toHaveBeenCalled();
	});

	it('surfaces a failing delete as an anchored error toast', async () => {
		const user = userEvent.setup();
		await renderRow();
		remote.deleteForm.setSubmitResult(() => Promise.reject(new Error('better-sqlite3 exploded')));

		await user.click(deleteButton());

		await waitFor(() => expect(toasts).toHaveLength(1));
		expect(toasts[0].variant).toBe('error');
		expect(toasts[0].message).toBe(m.form_error_unexpected());
		expect(screen.queryByText(/better-sqlite3/)).not.toBeInTheDocument();
	});
});

describe('TransactionTableRow (edit mode) — pending', () => {
	it('disables the row buttons during an edit submit without a spinner', async () => {
		await renderRow(() => {
			remote.editForm.form.pending = 1;
		});

		for (const button of [saveButton(), cancelButton(), deleteButton()]) {
			expect(button).toBeDisabled();
			expect(button).not.toHaveAttribute('aria-busy');
		}
		expect(document.querySelector('[data-slot=button-spinner]')).toBeNull();
	});

	it('disables the row buttons during a delete submit', async () => {
		await renderRow(() => {
			remote.deleteForm.form.pending = 1;
		});

		for (const button of [saveButton(), cancelButton(), deleteButton()]) {
			expect(button).toBeDisabled();
		}
	});
});
