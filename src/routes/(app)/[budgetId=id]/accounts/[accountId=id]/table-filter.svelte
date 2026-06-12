<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getCategoriesFlat } from '$lib/remote-functions/category.remote';
	import { type Snippet, untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import FunnelIcon from '~icons/ph/funnel';
	import FunnelDuotoneIcon from '~icons/ph/funnel-duotone';
	import FunnelXDuotoneIcon from '~icons/ph/funnel-x-duotone';

	import { colsClass, getTransactionURLParams } from './utils';

	let { budgetId, children }: { budgetId: string; children?: Snippet } = $props();

	const categories = $derived(await getCategoriesFlat({ budgetId }));
	const params = $derived(getTransactionURLParams(page.url));

	let selectedCategories = $derived(params.categoryId);
</script>

<Collapsible.Root>
	<Collapsible.Trigger class={buttonVariants()}>
		<FunnelIcon />
		{m.transaction_filter_title()}
	</Collapsible.Trigger>

	<Collapsible.Content forceMount>
		{#snippet child({ open, props })}
			{#if open}
				<div
					transition:slide={{ axis: 'y', duration: 200 }}
					class={cn(colsClass, 'w-full pt-3')}
					{...props}
				>
					{@render content()}
				</div>
			{/if}
		{/snippet}
	</Collapsible.Content>
</Collapsible.Root>

{#snippet content()}
	<div class={cn(colsClass, 'grid rounded-lg border border-info/10 bg-info/5 p-1.5')}>
		<div>
			<Select.Root type="multiple">
				<Select.Trigger class="w-fit">
					{#if selectedCategories.length}
						{m.transaction_filter_category_selected({ selected: selectedCategories.length })}
					{:else}
						{m.transaction_filter_category_empty()}
					{/if}
				</Select.Trigger>

				<Select.Content class="max-h-75">
					<Select.Item value="null">{m.transaction_filter_category_without()}</Select.Item>

					{#each categories as category (category.id)}
						<Select.Item value={category.id}>{category.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>
{/snippet}
