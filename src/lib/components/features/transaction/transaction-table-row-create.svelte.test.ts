import { m } from '$lib/paraglide/messages';
import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import { toasts } from '$lib/utils/anchored-toast.svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { parse } from 'valibot';
import { afterEach, describe, expect, it, vi } from 'vitest';

const remote = vi.hoisted(() => {
	let fieldState: Record<string, unknown> = {};
	// A thunk so a rejection is only created once the submit awaits it —
	// otherwise vitest reports it as unhandled before the lifecycle catches.
	let submitResult: () => Promise<unknown> = () => Promise.resolve(true);
	let allIssuesState: undefined | { message: string; path: (number | string)[] }[];

	const fieldNames = [
		'accountId',
		'budgetId',
		'categoryId',
		'date',
		'notes',
		'amount',
		'validated'
	] as const;

	const field = (name: string) => ({
		as: (type: string, value?: unknown) => {
			if (type === 'hidden') return { name, type, value };
			if (type === 'checkbox') return { name, type };
			if (type === 'text') return { name, type };
			return { name };
		},
		issues: vi.fn(() => undefined),
		set: (value: unknown) => {
			fieldState[name] = value;
		},
		value: () => fieldState[name]
	});

	const setAllFields = vi.fn((values: Record<string, unknown>) => {
		fieldState = { ...values };
	});

	const updatedQueries: unknown[] = [];
	const onSubmit = vi.fn();

	const enhance = (callback: (form: unknown) => Promise<void>) => ({
		onsubmit: (event: SubmitEvent) => {
			event.preventDefault();
			onSubmit();
			void callback({
				element: event.target as HTMLFormElement,
				submit: () => ({
					updates: (...queries: unknown[]) => {
						updatedQueries.push(...queries);
						return submitResult();
					}
				})
			});
		}
	});

	return {
		createTransaction: {
			enhance,
			fields: Object.assign(
				{ allIssues: () => allIssuesState, set: setAllFields },
				Object.fromEntries(fieldNames.map((name) => [name, field(name)]))
			),
			pending: 0
		},
		fieldState: () => fieldState,
		getBudget: vi.fn(async () => ({ currency: 'EUR', id: 'budget-1', name: 'Budget' })),
		getCategories: vi.fn(async () => [
			{ id: 'category-1', name: 'Groceries' },
			{ id: 'category-2', name: 'Rent' }
		]),
		listTransactions: vi.fn((args: unknown) => ({ args })),
		onSubmit,
		resetMocks: () => {
			fieldState = {};
			submitResult = () => Promise.resolve(true);
			allIssuesState = undefined;
			updatedQueries.length = 0;
			setAllFields.mockClear();
			onSubmit.mockClear();
		},
		setAllFields,
		setAllIssues: (issues: { message: string; path: (number | string)[] }[]) => {
			allIssuesState = issues;
		},
		setSubmitResult: (result: () => Promise<unknown>) => {
			submitResult = result;
		},
		updatedQueries
	};
});

vi.mock('$lib/remote-functions/transaction.remote', () => ({
	createTransaction: remote.createTransaction,
	listTransactions: remote.listTransactions
}));
vi.mock('$lib/remote-functions/budget.remote', () => ({ getBudget: remote.getBudget }));
vi.mock('$lib/remote-functions/category.remote', () => ({ getCategories: remote.getCategories }));

import TableRowCreate from './transaction-table-row-create.svelte';

const urlParams = parse(TransactionsURLParamsSchema, {});

const baseProps = {
	accountId: 'account-1',
	budgetId: 'budget-1',
	urlParams
};

afterEach(() => {
	[...toasts].forEach((toast) => toast.dismiss());
	remote.createTransaction.pending = 0;
});

async function renderRow(
	props: Partial<typeof baseProps> & { open?: boolean } = {},
	configure?: () => void
) {
	remote.resetMocks();
	configure?.();
	const merged = { ...baseProps, open: true, ...props };
	const utils = render(TableRowCreate, { props: merged });
	const form = merged.open ? await screen.findByRole('row') : null;
	if (form) {
		// The Popover moves focus into its content once opening completes. Wait
		// for that one-shot autofocus to land before a test drives the keyboard,
		// so it can't steal focus from the field mid-interaction and drop the
		// keystroke that submits the form.
		await waitFor(() => expect(document.activeElement).not.toBe(document.body));
	}
	return { ...utils, form };
}

describe('TableRowCreate', () => {
	it('renders the create form when open', async () => {
		const { form } = await renderRow();
		expect(form).toBeInTheDocument();
	});

	it('submits with Enter from a field and closes the popover', async () => {
		const user = userEvent.setup();
		await renderRow();

		const notes = screen.getByRole('textbox', { name: 'Notes' });
		await user.click(notes);
		await user.keyboard('{Enter}');

		expect(remote.onSubmit).toHaveBeenCalledTimes(1);
		// The row slides out; it leaves the DOM once the outro finishes.
		await waitFor(() => expect(screen.queryByRole('row')).not.toBeInTheDocument());
	});

	it('keeps the popover open when submitting with Shift+Enter', async () => {
		const user = userEvent.setup();
		await renderRow();

		const notes = screen.getByRole('textbox', { name: 'Notes' });
		await user.click(notes);
		await user.keyboard('{Shift>}{Enter}{/Shift}');

		expect(remote.onSubmit).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('row')).toBeInTheDocument();
	});

	it('does not submit on Enter inside the category combobox', async () => {
		await renderRow();

		const combobox = screen.getByRole('combobox', { name: 'Category' });
		combobox.focus();
		await fireEvent.keyDown(combobox, { key: 'Enter' });

		expect(remote.onSubmit).not.toHaveBeenCalled();
		expect(screen.getByRole('row')).toBeInTheDocument();
	});

	it('updates the transaction list for the account and url params on submit', async () => {
		const user = userEvent.setup();
		await renderRow();

		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(remote.listTransactions).toHaveBeenCalledWith({ accountId: 'account-1', ...urlParams });
		expect(remote.updatedQueries).toHaveLength(1);
	});

	it('closes the popover after saving with the save button', async () => {
		const user = userEvent.setup();
		await renderRow();

		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(remote.onSubmit).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(screen.queryByRole('row')).not.toBeInTheDocument());
	});

	it('keeps the popover open after save and continue', async () => {
		const user = userEvent.setup();
		await renderRow();

		await user.click(screen.getByRole('button', { name: 'Save & Continue' }));

		expect(remote.onSubmit).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('row')).toBeInTheDocument();
	});

	it('keeps the popover open when the submission fails', async () => {
		const user = userEvent.setup();
		await renderRow();
		remote.setSubmitResult(() => Promise.resolve(false));

		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(remote.onSubmit).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('row')).toBeInTheDocument();
	});

	it('closes the popover with the cancel button without submitting', async () => {
		const user = userEvent.setup();
		await renderRow();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(remote.onSubmit).not.toHaveBeenCalled();
		await waitFor(() => expect(screen.queryByRole('row')).not.toBeInTheDocument());
	});

	// The draft is scoped to the viewed account: reopening on the SAME account
	// keeps a half-typed draft, but switching accounts and reopening must clear
	// it. The reset is keyed on the accountId change, not the popover open event
	// (bits-ui never fires onOpenChangeComplete(true) for static popover content).
	it('keeps the draft when reopened on the same account', async () => {
		const { rerender } = await renderRow({ open: true });

		// The fresh mount seeds the defaults once for this account.
		await waitFor(() => expect(remote.setAllFields).toHaveBeenCalledTimes(1));
		remote.setAllFields.mockClear();

		// Close, then reopen on the same account: no reset, the draft survives.
		await rerender({ ...baseProps, open: false });
		await rerender({ ...baseProps, open: true });
		await screen.findByRole('row');

		expect(remote.setAllFields).not.toHaveBeenCalled();
	});

	it('resets the draft when reopened on a different account', async () => {
		const { rerender } = await renderRow({ open: true });

		await waitFor(() => expect(remote.setAllFields).toHaveBeenCalledTimes(1));
		remote.setAllFields.mockClear();

		// Navigate to another account, then reopen the create form.
		await rerender({ ...baseProps, accountId: 'account-2', open: false });
		await rerender({ ...baseProps, accountId: 'account-2', open: true });
		await screen.findByRole('row');

		await waitFor(() => expect(remote.setAllFields).toHaveBeenCalledTimes(1));
		const values = remote.fieldState();
		expect(values.amount).toBe(0);
		expect(values.categoryId).toBeUndefined();
		expect(values.notes).toBeUndefined();
		expect(values.validated).toBe(false);
		expect(values.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('TableRowCreate — row feedback contract', () => {
	it('shows all field issues in one shared error line', async () => {
		await renderRow({}, () =>
			remote.setAllIssues([
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

	it('disables the row buttons during flight without a spinner', async () => {
		await renderRow({}, () => {
			remote.createTransaction.pending = 1;
		});

		for (const name of ['Save', 'Save & Continue', 'Cancel']) {
			const button = screen.getByRole('button', { name });
			expect(button).toBeDisabled();
			expect(button).not.toHaveAttribute('aria-busy');
		}
		expect(document.querySelector('[data-slot=button-spinner]')).toBeNull();
	});

	it('does not submit from the keyboard while a submit is in flight', async () => {
		const user = userEvent.setup();
		await renderRow({}, () => {
			remote.createTransaction.pending = 1;
		});

		const notes = screen.getByRole('textbox', { name: 'Notes' });
		await user.click(notes);
		await user.keyboard('{Enter}');

		expect(remote.onSubmit).not.toHaveBeenCalled();
	});

	it('surfaces a thrown submit error as an anchored error toast and keeps the row open', async () => {
		const user = userEvent.setup();
		await renderRow();
		remote.setSubmitResult(() => Promise.reject(new Error('better-sqlite3 exploded')));

		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => expect(toasts).toHaveLength(1));
		expect(toasts[0].variant).toBe('error');
		expect(toasts[0].message).toBe(m.form_error_unexpected());
		expect(toasts[0].anchor).not.toBeNull();
		expect(screen.getByRole('row')).toBeInTheDocument();
		expect(screen.queryByText(/better-sqlite3/)).not.toBeInTheDocument();
	});
});
