import type { ListTransaction } from '$lib/server/db/user-context/transaction';

import { m } from '$lib/paraglide/messages';
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
				ids: { 0: { as: () => ({ name: 'ids[0]' }) } },
				validated: { as: (type: string, value: unknown) => ({ name: 'validated', type, value }) }
			},
			pending: 0
		})
	}
}));
// The validate toggle rendered per row refreshes account-balance queries, so
// its account.remote import loads too; stub it to keep this suite off the real
// remote module (which pulls $app/paths).
vi.mock('$lib/remote-functions/account.remote', () => ({
	getAccount: vi.fn(),
	getAccountBalances: vi.fn()
}));
vi.mock('$lib/remote-functions/register.remote', () => ({
	getCheckpointSummary: vi.fn(),
	listTransactions: vi.fn()
}));

import TransactionListMobile from './transaction-list-mobile.svelte';

function transaction(overrides: Partial<ListTransaction> & { id: string }): ListTransaction {
	return {
		accountId: 'account-1',
		amount: -1250,
		budgetId: 'budget-1',
		categoryId: 'category-1',
		categoryName: 'Groceries',
		checkpointId: null,
		counterpartAccountId: null,
		createdAt: '2026-07-14T00:00:00.000Z',
		createdBy: 'user-1',
		createdByName: 'User',
		date: '2026-07-14',
		notes: null,
		sealed: false,
		sealedAt: null,
		transferId: null,
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

	it('tints a sealed card and locks its rail toggle behind the stamp badge', () => {
		render(TransactionListMobile, {
			props: {
				...baseProps,
				transactions: [
					transaction({
						checkpointId: 'checkpoint-1',
						id: 'a',
						sealed: true,
						sealedAt: new Date('2026-07-20T12:00:00Z'),
						validated: true
					}),
					transaction({ id: 'b' })
				]
			}
		});

		const [sealedCard, openCard] = screen
			.getAllByRole('row')
			.filter((row) => row.querySelector('[role=cell] button'));
		expect(sealedCard).toHaveClass('bg-foreground/5');
		expect(openCard).not.toHaveClass('bg-foreground/5');
		expect(
			screen.getAllByRole('button', { name: m.transactions_table_toggle_validated() })
		).toHaveLength(1);
		expect(sealedCard).toHaveTextContent(/Sealed by the checkpoint on/);
	});

	it('keeps the toggle of a transfer leg sealed only through its partner', () => {
		render(TransactionListMobile, {
			props: {
				...baseProps,
				transactions: [
					transaction({
						counterpartAccountId: 'account-2',
						counterpartAccountName: 'Savings',
						id: 'a',
						sealed: true,
						sealedAt: new Date('2026-07-20T12:00:00Z'),
						transferId: 'transfer-1'
					})
				]
			}
		});

		const toggle = screen.getByRole('button', { name: m.transactions_table_toggle_validated() });
		expect(toggle).toBeEnabled();
		expect(toggle).toHaveAttribute('title', expect.stringMatching(/other account's checkpoint/));
	});
});
