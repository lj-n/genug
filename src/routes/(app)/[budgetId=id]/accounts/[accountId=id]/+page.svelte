<script lang="ts">
	import { resolve } from '$app/paths';
	import { AccountBalances } from '$lib/components/account';
	import {
		setTableContext,
		TableContext,
		TransactionTable
	} from '$lib/components/transaction-table';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { schemaTransactionEdit } from '$lib/schemas/transactions';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhChartLineUp from '~icons/ph/chart-line-up';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tableContext = setTableContext(
		new TableContext(
			() => data.categories,
			superForm(
				untrack(() => data.forms.transactionEdit),
				{
					onUpdated() {
						tableContext.cancelEditing();
					},
					validators: zod4Client(schemaTransactionEdit),
					warnings: { duplicateId: false }
				}
			),
			() => data.filter,
			() => data.pagination,
			() => data.transactions,
			untrack(() => data.account.id),
			untrack(() => data.budget.id)
		)
	);
</script>

<Page.Root>
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{data.account.name}
		</Page.Title>

		<Button
			variant="ghost"
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/detail', {
				accountId: data.account.id,
				budgetId: data.budget.id
			})}
		>
			<PhChartLineUp class="size-6 text-muted" />
			{m.account_details()}
		</Button>
	</Page.Header>

	<Page.Content>
		<AccountBalances balances={data.balances} />

		<Separator orientation="horizontal" />

		<TransactionTable categories={data.categories} form={data.forms.transactionCreate} />
	</Page.Content>
</Page.Root>
