<script lang="ts">
	import type { PageData } from './$types';
	import BudgetTable from './budget.table.svelte';
	export let data: PageData;
</script>

<svelte:head>
	<title>Budget | {data.localDate}</title>
</svelte:head>

<h1 class="mb-12 scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
	Budget for
	<span class="text-primary">{data.localDate}</span>
</h1>
{#key data}
<BudgetTable data={data} />
{/key}
