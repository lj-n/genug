<script lang="ts">
	import TransactionsTable from './transactions.table.svelte';
	import type { PageData } from './$types';
	import AccountTeaser from '$lib/components/accounts/accounts.teaser.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>Transactions</title>
</svelte:head>

<div class="flex justify-between gap-4">
	<h1 class="mb-6 scroll-m-20 text-2xl font-bold tracking-tight lg:text-3xl">
		Transactions
	</h1>

	<AccountTeaser accounts={data.accounts} />
</div>

<TransactionsTable {data} />
