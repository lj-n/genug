<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { getCategoriesFlat } from '$lib/remote-functions/category.remote';
	import PhXCircle from '~icons/ph/x-circle';

	let {
		budgetId,
		categoryIds = [],
		notes,
		onOpenDialog,
		onRemoveFilterParam
	}: {
		budgetId: string;
		categoryIds?: string[];
		notes?: null | string;
		onOpenDialog: (type: 'category' | 'notes') => void;
		onRemoveFilterParam: (key: string, value?: string) => void;
	} = $props();

	const categories = $derived(await getCategoriesFlat({ budgetId }));

	const getCategoryLabel = (id: string) => {
		const name = categories.find((f) => f.id === id)?.name ?? '';
		return m.transaction_filter_label_category({ value: name });
	};
</script>

{#snippet filterTag(props: { label: string; openDialog: () => void; removeTag: () => void })}
	<div
		role="button"
		tabindex="0"
		class="flex items-center gap-0.5 rounded-full border border-info/15 bg-info/5 pl-2 text-sm shadow-xs hover:cursor-pointer hover:border-interactive/30 hover:bg-interactive/5"
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
	{#each categoryIds as id (id)}
		{@render filterTag({
			label: getCategoryLabel(id),
			openDialog: () => onOpenDialog('category'),
			removeTag: () => onRemoveFilterParam('categoryId', id)
		})}
	{/each}

	{#if notes}
		{@render filterTag({
			label: m.transaction_filter_label_notes({ value: notes }),
			openDialog: () => onOpenDialog('notes'),
			removeTag: () => onRemoveFilterParam('notes')
		})}
	{/if}
</div>
