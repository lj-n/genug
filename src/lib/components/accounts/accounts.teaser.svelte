<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import LucideFileSpreadsheet from '~icons/lucide/file-spreadsheet';

	import * as Table from '$lib/components/ui/table';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { getAccountsWithBalance } from '$lib/server/accounts';

	export let accounts: ReturnType<typeof getAccountsWithBalance>;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>
			<span class="flex items-center">
				<LucideFileSpreadsheet class="mr-2" />
				Account Balances
			</span>
		</Card.Title>
		<Card.Description>
			See pending transactions and future account balances.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Account</Table.Head>
					<Table.Head class="text-right">Current Balance</Table.Head>
					<Table.Head class="text-right">Pending Transactions</Table.Head>
					<Table.Head class="text-right">Future Balance</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each accounts as account, i (i)}
					<Table.Row>
						<Table.Cell class="p-1 pr-8 font-medium">{account.name}</Table.Cell>
						<Table.Cell class="px-4 py-1 text-right tabular-nums font-semibold">
							{formatFractionToLocaleCurrency(account.validated)}
						</Table.Cell>
						<Table.Cell class="px-4 py-1 text-right tabular-nums font-semibold">
							{formatFractionToLocaleCurrency(account.pending)}
						</Table.Cell>
						<Table.Cell class="px-4 py-1 text-right tabular-nums font-semibold">
							{formatFractionToLocaleCurrency(account.working)}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>
