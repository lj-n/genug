<!-- <script lang="ts">
	import type { TransactionFilterParam } from '$db/actions/queries/transaction';

	import { Button } from '$lib/components/ui/button';
	import PhXCircle from '~icons/ph/x-circle';

	import type { PageData } from './$types';

	import { getTableContext } from './table-context.svelte';

	type Category = PageData['categories'][number];

	type TableFilterLabelProps = {
		categories: Category[];
		filter: TransactionFilterParam;
		openFilterCategory: () => void;
		openFilterNotes: () => void;
	};

	let { categories, filter, openFilterCategory, openFilterNotes }: TableFilterLabelProps = $props();

	const tableContext = getTableContext();

	const getCategoryLabel = (id: string) => {
		const name = categories.find((f) => f.id === id)?.name;
		return `Kategorie ist ${name}`;
	};
</script>

{#snippet filterTag(label: string, openDialog: () => void, removeTag: (e: MouseEvent) => void)}
	<div
		role="button"
		tabindex="0"
		class="flex items-center gap-0.5 rounded-full border border-muted/20 bg-surface pl-2 text-sm shadow-xs hover:cursor-pointer hover:border-interactive/30 hover:bg-interactive/5"
		onclick={() => openDialog()}
		onkeydown={(e) => e.key === 'Enter' && openDialog()}
	>
		<span>{label}</span>
		<Button
			variant="ghost"
			size="icon-xs"
			class="rounded-full"
			onclick={async (e) => {
				e.stopPropagation();
				removeTag(e);
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
				{@render filterTag(getCategoryLabel(id), openFilterCategory, () => {
					tableContext.removeTableURLParams('categoryId', id);
				})}
			{/each}
		{:else}
			{@render filterTag(getCategoryLabel(filter.categoryId), openFilterCategory, () => {
				tableContext.removeTableURLParams('categoryId', filter.categoryId as string);
			})}
		{/if}
	{/if}

	{#if filter.notes}
		{@render filterTag(`Notizen beinhaltet ${filter.notes}`, openFilterNotes, () => {
			tableContext.removeTableURLParams('notes');
		})}
	{/if}
</div> -->
