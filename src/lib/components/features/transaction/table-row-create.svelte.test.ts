import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { parse } from 'valibot';
import { describe, expect, it, vi } from 'vitest';

const remote = vi.hoisted(() => {
	let fieldState: Record<string, unknown> = {};
	let submitResult: Promise<unknown> = Promise.resolve(true);

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
						return submitResult;
					}
				})
			});
		}
	});

	return {
		createTransaction: {
			enhance,
			fields: Object.assign(
				{ set: setAllFields },
				Object.fromEntries(fieldNames.map((name) => [name, field(name)]))
			)
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
			submitResult = Promise.resolve(true);
			updatedQueries.length = 0;
			setAllFields.mockClear();
			onSubmit.mockClear();
		},
		setAllFields,
		setSubmitResult: (result: Promise<unknown>) => {
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

import TableRowCreate from './table-row-create.svelte';

const urlParams = parse(TransactionsURLParamsSchema, {});

const baseProps = {
	accountId: 'account-1',
	budgetId: 'budget-1',
	urlParams
};

async function renderRow(props: Partial<typeof baseProps> & { open?: boolean } = {}) {
	remote.resetMocks();
	const merged = { ...baseProps, open: true, ...props };
	const utils = render(TableRowCreate, { props: merged });
	const form = merged.open ? await screen.findByRole('row') : null;
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
		expect(screen.queryByRole('row')).not.toBeInTheDocument();
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
		expect(screen.queryByRole('row')).not.toBeInTheDocument();
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
		remote.setSubmitResult(Promise.resolve(false));

		await user.click(screen.getByRole('button', { name: 'Save' }));

		expect(remote.onSubmit).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('row')).toBeInTheDocument();
	});

	it('closes the popover with the cancel button without submitting', async () => {
		const user = userEvent.setup();
		await renderRow();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(remote.onSubmit).not.toHaveBeenCalled();
		expect(screen.queryByRole('row')).not.toBeInTheDocument();
	});

	// bits-ui 2.18.1 never fires onOpenChangeComplete(true) for Popover.ContentStatic — on
	// open, its presence manager reads the content node before it is mounted and bails, so
	// only the close direction fires (reproduced in real Chromium, not a jsdom artifact).
	// The component's reset-on-open is therefore currently dead code in the app as well.
	// This test states the intended behavior; when a bits-ui upgrade fixes the callback,
	// vitest will report it as "expected to fail, but passed" — then remove the `.fails`.
	it.fails('resets the form fields when the popover opens', async () => {
		const { rerender } = await renderRow({ open: false });

		expect(remote.setAllFields).not.toHaveBeenCalled();

		await rerender({ open: true });
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
