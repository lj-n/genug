import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { formatTransactionDate } from '$lib/utils/format-transaction-date';
import { parseDate } from '@internationalized/date';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/remote-functions/transaction.remote', () => ({
	batchValidateTransactions: {
		for: () => ({
			enhance: () => ({}),
			fields: {
				ids: { as: () => ({ name: 'ids' }) },
				validated: { as: (type: string, value: unknown) => ({ name: 'validated', type, value }) }
			},
			pending: 0
		})
	}
}));

import TransactionListMobile from './transaction-list-mobile.svelte';

function transaction(overrides: Partial<ListTransaction> & { id: string }): ListTransaction {
	return {
		accountId: 'account-1',
		amount: -1250,
		budgetId: 'budget-1',
		categoryId: 'category-1',
		categoryName: 'Groceries',
		createdAt: '2026-07-14T00:00:00.000Z',
		createdBy: 'user-1',
		createdByName: 'User',
		date: '2026-07-14',
		notes: null,
		validated: false,
		...overrides
	} as ListTransaction;
}

const baseProps = {
	currency: 'EUR' as const,
	onEdit: () => {}
};

describe('TransactionListMobile', () => {
	it('renders one date group per date, newest first', () => {
		render(TransactionListMobile, {
			props: {
				...baseProps,
				transactions: [
					transaction({ date: '2026-07-01', id: 'a' }),
					transaction({ date: '2026-07-14', id: 'b' }),
					transaction({ date: '2026-07-14', id: 'c' })
				]
			}
		});

		const newest = formatTransactionDate(parseDate('2026-07-14'));
		const oldest = formatTransactionDate(parseDate('2026-07-01'));
		const headers = [screen.getByText(newest), screen.getByText(oldest)];
		// Document order encodes the newest-first sort.
		expect(
			headers[0].compareDocumentPosition(headers[1]) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	it('shows category, signed amount, and notes on a card', () => {
		render(TransactionListMobile, {
			props: {
				...baseProps,
				transactions: [transaction({ amount: -1250, id: 'a', notes: 'Weekly shop' })]
			}
		});

		expect(screen.getByText('Groceries')).toBeInTheDocument();
		expect(screen.getByText('Weekly shop')).toBeInTheDocument();
		expect(screen.getByText(/-.*12\.50/)).toBeInTheDocument();
	});

	it('falls back to the empty-category label', () => {
		render(TransactionListMobile, {
			props: {
				...baseProps,
				transactions: [transaction({ categoryId: null, categoryName: null, id: 'a' })]
			}
		});

		expect(screen.getByText('No Category')).toBeInTheDocument();
	});

	it('reports a tap on the card through onEdit', async () => {
		const user = userEvent.setup();
		const onEdit = vi.fn();
		const item = transaction({ id: 'a' });
		render(TransactionListMobile, {
			props: { ...baseProps, onEdit, transactions: [item] }
		});

		await user.click(screen.getByRole('button', { name: 'Edit category' }));
		await user.click(screen.getByRole('button', { name: 'Edit amount' }));
		await user.click(screen.getByRole('button', { name: 'Edit notes' }));

		expect(onEdit).toHaveBeenCalledTimes(3);
		expect(onEdit).toHaveBeenCalledWith(item);
	});
});
