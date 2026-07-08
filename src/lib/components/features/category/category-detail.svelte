<script lang="ts">
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategoryById } from '$lib/remote-functions/category.remote';

	import CategoryArchive from './category-archive.svelte';
	import CategoryEdit from './category-edit.svelte';
	import CategoryStats from './category-stats.svelte';

	let { categoryId }: { categoryId: string } = $props();

	const category = $derived(await getCategoryById({ categoryId }));
	const budget = $derived(await getBudget(category.budgetId));
	const currency = $derived(budget.currency);
</script>

<div class="grid gap-6 @3xl:grid-cols-2">
	<CategoryEdit {category} {currency} />

	<CategoryStats {category} {currency} />

	<CategoryArchive {category} {currency} />
</div>
