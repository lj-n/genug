<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { type Snippet, tick, untrack } from 'svelte';
	import FunnelBoldIcon from '~icons/ph/funnel-bold';
	import XIcon from '~icons/ph/x';

	import { type FilterType, TransactionFilter } from './filter.svelte';
	import TableFilterCategory from './table-filter-category.svelte';
	import TableFilterNotes from './table-filter-notes.svelte';
	import { getTransactionURLParams } from './utils';

	let { budgetId, children }: { budgetId: string; children?: Snippet } = $props();

	const params = $derived(getTransactionURLParams(page.url));
	let filter = $state(new TransactionFilter(untrack(() => params)));

	const allActive = $derived(filter.allActive);
	const anyActive = $derived(filter.anyActive);
	const availableFilters = $derived(filter.available);

	let categoryRef = $state<HTMLButtonElement | null>(null);
	let notesRef = $state<HTMLInputElement | null>(null);

	function addAndFocus(type: FilterType) {
		filter.add(type);
		tick().then(() => {
			if (type === 'category') categoryRef?.focus();
			else notesRef?.focus();
		});
	}

	function handleCategoryChange(value: string[]) {
		filter.updateValue('category', value);
	}

	function handleNotesChange(value: string) {
		filter.updateValue('notes', value);
	}
</script>

<div class="flex w-full flex-col gap-2">
	<div class="flex gap-1.5">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger disabled={allActive}>
				{#snippet child({ props })}
					<Button {...props}>
						<FunnelBoldIcon />
						{m.transaction_filter_title()}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content class="w-fit">
				{#each availableFilters as f (f.type)}
					<DropdownMenu.Item onSelect={() => addAndFocus(f.type)}>
						{filter.getConfig(f.type).label()}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		{#if anyActive}
			<Button variant="destructive" size="icon" onclick={() => filter.clearAll()}>
				<XIcon />
			</Button>
		{/if}

		{@render children?.()}
	</div>

	{#each filter.items as f (f.type)}
		{#if f.active}
			<div class="flex items-center gap-1.5 rounded-lg border border-info/30 bg-info/5 p-1.5">
				<p class="mr-auto pl-1.5 text-sm font-medium text-info">
					{filter.getConfig(f.type).description()}
				</p>

				{#if f.type === 'category'}
					<TableFilterCategory
						{budgetId}
						bind:value={f.value}
						onchange={handleCategoryChange}
						bind:elementRef={categoryRef}
					/>
				{:else}
					<TableFilterNotes
						bind:value={f.value}
						onchange={handleNotesChange}
						bind:elementRef={notesRef}
					/>
				{/if}

				<Button size="icon" variant="ghost" onclick={() => filter.remove(f.type)}>
					<XIcon />
				</Button>
			</div>
		{/if}
	{/each}
</div>
