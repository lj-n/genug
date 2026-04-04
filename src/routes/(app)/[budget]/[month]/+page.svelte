<script lang="ts">
	import type { PageProps } from './$types';

	import BudgetTable from './budget-table.svelte';

	let { data }: PageProps = $props();
</script>

<div class="p-8">
	<BudgetTable categories={data.categories} />
</div>
