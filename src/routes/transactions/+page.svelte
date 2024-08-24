<script lang="ts">
	import TransactionsTable from './transactions.table.svelte';
	import type { PageData } from './$types';

	import * as Card from '$lib/components/ui/card';
	import LucideFileSpreadsheet from '~icons/lucide/file-spreadsheet';
	import LucideTimer from '~icons/lucide/timer';

	import * as Table from '$lib/components/ui/table';
	import { formatDistanceToNow } from 'date-fns';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let data: PageData;

	let lastUpdate = new Date();
	let lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });

	let timer = setInterval(() => {
		lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });
	}, 1000);

	$: if (data) {
		clearInterval(timer);
		lastUpdate = new Date();
		timer = setInterval(() => {
			lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });
		}, 1000);
	}
</script>

<svelte:head>
	<title>Transactions</title>
</svelte:head>

<div class="flex justify-between gap-4">
	<h1 class="mb-12 scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
		Transactions
	</h1>

	<Card.Root class="hidden md:block">
		<Card.Header>
			<Card.Title>
				<span class="flex items-center">
					<LucideFileSpreadsheet class="mr-2" />
					Account Balances
				</span>
			</Card.Title>
			<Card.Description>
				Track your account balances over time.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Account</Table.Head>
						<Table.Head class="text-right">Validated</Table.Head>
						<Table.Head class="text-right">Pending</Table.Head>
						<Table.Head class="text-right">Working</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.accounts as account, i (i)}
						<Table.Row>
							<Table.Cell class="p-1 pr-8 font-medium"
								>{account.name}</Table.Cell
							>
							<Table.Cell class="px-4 py-1 text-right tabular-nums">
								{formatFractionToLocaleCurrency(account.validated)}
							</Table.Cell>
							<Table.Cell class="px-4 py-1 text-right tabular-nums">
								{#if account.pending > 0}
									+
								{/if}
								{formatFractionToLocaleCurrency(account.pending)}
							</Table.Cell>
							<Table.Cell class="px-4 py-1 text-right tabular-nums">
								{formatFractionToLocaleCurrency(account.working)}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>

		<Card.Footer
			class="justify-end gap-1 text-xs font-semibold text-muted-foreground"
		>
			<LucideTimer />
			Last Updated: {lastUpdated}
		</Card.Footer>
	</Card.Root>
</div>

<TransactionsTable {data} />
