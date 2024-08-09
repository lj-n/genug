<script lang="ts">
	import TransactionsTable from './transactions.table.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<TransactionsTable {data} />
