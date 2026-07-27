<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { type Snippet, tick } from 'svelte';
	import FunnelBoldIcon from '~icons/ph/funnel-bold';
	import XIcon from '~icons/ph/x';

	import type { FilterType, TransactionFilter } from './transaction-filter.svelte';

	import TableFilterCategory from './transaction-table-filter-category.svelte';
	import TableFilterNotes from './transaction-table-filter-notes.svelte';

	let {
		budgetId,
		children,
		filter,
		leading,
		onClearAllFilters,
		onClearFilter,
		onSetFilter
	}: {
		budgetId: string;
		children?: Snippet;
		filter: TransactionFilter;
		leading?: Snippet;
		onClearAllFilters: () => void;
		onClearFilter: (type: FilterType) => void;
		onSetFilter: (type: FilterType, value: string | string[]) => void;
	} = $props();

	const allActive = $derived(filter.allActive);
	const anyActive = $derived(filter.anyActive);
	const availableFilters = $derived(filter.available);

	let categoryRef = $state<HTMLButtonElement | null>(null);
	let notesRef = $state<HTMLInputElement | null>(null);

	function addAndFocus(type: FilterType) {
		onSetFilter(type, filter.getConfig(type).defaultValue);
		tick().then(() => {
			if (type === 'category') categoryRef?.focus();
			else notesRef?.focus();
		});
	}

	function handleCategoryChange(value: string[]) {
		onSetFilter('category', value);
	}

	function handleNotesChange(value: string) {
		onSetFilter('notes', value);
	}
</script>

<div class="flex w-full flex-col gap-2">
	<div class="flex flex-wrap items-end gap-3">
		<!-- Balances (or nothing) sit to the left; every control clusters on the right. -->
		{@render leading?.()}
		<div class="ml-auto flex gap-1.5">
			<!-- Filtering is desktop-only; on the phone the register keeps only the create affordance.
			     The filter trigger and clear-all form their own group, separate from the create actions. -->
			<ButtonGroup.Root class="hidden @3xl/main:flex">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger disabled={allActive}>
						{#snippet child({ props })}
							<Button
								{...props}
								size="icon"
								class="@3xl/main:size-11 @7xl/main:size-9"
								aria-label={m.transaction_filter_title()}
							>
								<FunnelBoldIcon />
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
					<Button
						variant="destructive"
						size="icon"
						class="@3xl/main:size-11 @7xl/main:size-9"
						onclick={() => onClearAllFilters()}
					>
						<XIcon />
					</Button>
				{/if}
			</ButtonGroup.Root>

			{@render children?.()}
		</div>
	</div>

	{#each filter.items as f (f.type)}
		{#if f.active}
			<div
				class="hidden flex-wrap items-center gap-1.5 rounded-lg border border-info/30 bg-info/5 p-1.5 @3xl/main:flex"
			>
				<p class="mr-auto pl-1.5 text-sm font-medium text-info">
					{filter.getConfig(f.type).description()}
				</p>

				{#if f.type === 'category'}
					<TableFilterCategory
						{budgetId}
						value={f.value}
						onchange={handleCategoryChange}
						bind:elementRef={categoryRef}
					/>
				{:else}
					<TableFilterNotes
						value={f.value}
						onchange={handleNotesChange}
						bind:elementRef={notesRef}
					/>
				{/if}

				<Button size="icon" variant="ghost" onclick={() => onClearFilter(f.type)}>
					<XIcon />
				</Button>
			</div>
		{/if}
	{/each}
</div>
