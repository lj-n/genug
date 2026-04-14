<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';

	import type { PageProps } from './$types';

	import CategoryDetail from '../categories/[categoryId=id]/category-detail.svelte';
	import BudgetTable from './budget-table.svelte';

	let { data }: PageProps = $props();

	let open = $state(false);
	let selectedCategoryId = $state<null | string>(null);
	let selectedCategory = $derived.by(() => {
		if (!selectedCategoryId) return null;
		return (
			data.categories.find((c) => c.id === selectedCategoryId) ??
			data.archivedCategories.find((c) => c.id === selectedCategoryId) ??
			null
		);
	});
</script>

<div class="p-8">
	<BudgetTable
		categories={data.categories}
		openCategoryDialog={(category) => {
			selectedCategoryId = category.id;
			open = true;
		}}
	/>
</div>

<Dialog.Root bind:open onOpenChangeComplete={(isOpen) => !isOpen && (selectedCategoryId = null)}>
	<Dialog.Content class="max-w-4xl">
		{#if selectedCategory}
			<CategoryDetail category={selectedCategory} />
		{/if}
	</Dialog.Content>
</Dialog.Root>
