<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import PhXCircle from '~icons/ph/x-circle';

	import { getTableContext } from './table-context.svelte';

	const tableContext = getTableContext();

	const categories = $derived(tableContext.categories());
	const filter = $derived(tableContext.filter());

	const getCategoryLabel = (id: string) => {
		const name = categories.find((f) => f.id === id)?.name ?? '';
		return m.transaction_filter_label_category({ value: name });
	};
</script>

{#snippet filterTag(props: { label: string; openDialog: () => void; removeTag: () => void })}
	<div
		role="button"
		tabindex="0"
		class="flex items-center gap-0.5 rounded-full border border-muted/20 bg-surface pl-2 text-sm shadow-xs hover:cursor-pointer hover:border-interactive/30 hover:bg-interactive/5"
		onclick={props.openDialog}
		onkeydown={(e) => e.key === 'Enter' && props.openDialog()}
	>
		<span>{props.label}</span>
		<Button
			variant="ghost"
			size="icon-xs"
			class="rounded-full"
			onclick={async (e) => {
				e.stopPropagation();
				props.removeTag();
			}}
		>
			<PhXCircle />
		</Button>
	</div>
{/snippet}

<div class="flex flex-wrap gap-1">
	{#if filter.categoryId}
		{#if Array.isArray(filter.categoryId)}
			{#each filter.categoryId as id (id)}
				{@render filterTag({
					label: getCategoryLabel(id),
					openDialog: () => tableContext.openFilterDialog('category'),
					removeTag: () => tableContext.removeFilterParams('categoryId', id)
				})}
			{/each}
		{:else}
			{@render filterTag({
				label: getCategoryLabel(filter.categoryId),
				openDialog: () => tableContext.openFilterDialog('category'),
				removeTag: () => tableContext.removeFilterParams('categoryId', filter.categoryId as string)
			})}
		{/if}
	{/if}

	{#if filter.notes}
		{@render filterTag({
			label: m.transaction_filter_label_notes({ value: filter.notes }),
			openDialog: () => tableContext.openFilterDialog('notes'),
			removeTag: () => tableContext.removeFilterParams('notes')
		})}
	{/if}
</div>
