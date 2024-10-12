<script lang="ts">
	import TransactionsTable from './transactions.table.svelte';
	import type { PageData } from './$types';

	import * as Card from '$lib/components/ui/card';
	import LucideFileSpreadsheet from '~icons/lucide/file-spreadsheet';
	import LucideTimer from '~icons/lucide/timer';

	import * as Table from '$lib/components/ui/table';
	import AccountTeaser from '$lib/components/accounts/accounts.teaser.svelte';
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
	<h1 class="mb-6 scroll-m-20 text-2xl font-bold tracking-tight lg:text-3xl">
		Transactions
	</h1>

	<AccountTeaser	accounts={data.accounts} />
</div>

<TransactionsTable {data} />
