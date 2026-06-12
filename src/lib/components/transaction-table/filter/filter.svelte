<script lang="ts">
	import type { TransactionFilterParam } from '$db/transaction';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { cn } from 'tailwind-variants';
	import FunnelIcon from '~icons/ph/funnel';
	import FunnelDuotoneIcon from '~icons/ph/funnel-duotone';
	import FunnelXDuotoneIcon from '~icons/ph/funnel-x-duotone';

	import FilterCategory from './filter-category.svelte';
	import FilterList from './filter-list.svelte';
	import FilterNotes from './filter-notes.svelte';
	import { getFilterLength } from './filter-util';

	let { budgetId }: { budgetId: string } = $props();

	// ── URL-Parameter lesen ─────────────────────────────────────
	const categoryId = $derived(page.url.searchParams.getAll('categoryId'));
	const notes = $derived(page.url.searchParams.get('notes'));

	const filter = $derived<Partial<TransactionFilterParam>>({
		...(categoryId.length > 0 ? { categoryId } : {}),
		...(notes ? { notes } : undefined)
	});

	let filterLength = $derived(getFilterLength(filter));
	let showAsButtonGroup = $derived(filterLength > 0);

	// ── Dialog-State (lokal, kein Context) ──────────────────────
	let dialogOpen = $state(false);
	let dialogType = $state<'category' | 'notes' | null>(null);

	// ── URL-Navigation ──────────────────────────────────────────
	const FILTER_KEYS: (keyof TransactionFilterParam)[] = [
		'accountId',
		'categoryId',
		'fromDate',
		'maxAmount',
		'minAmount',
		'notes',
		'toDate',
		'validated'
	];

	function navigate(searchParams: URLSearchParams) {
		return goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${searchParams.toString()}`, {
				accountId: page.params.accountId!,
				budgetId: page.params.budgetId!
			}),
			{ keepFocus: true, noScroll: true }
		);
	}

	function setFilterParams(params: Partial<TransactionFilterParam>) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		for (const key of Object.keys(params)) {
			searchParams.delete(key);
		}
		searchParams.delete('page');
		for (const [key, value] of Object.entries(params)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				value.forEach((v) => searchParams.append(key, v));
			} else {
				searchParams.set(key, value.toString());
			}
		}
		navigate(searchParams);
	}

	function clearAllFilters() {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		FILTER_KEYS.forEach((key) => searchParams.delete(key));
		searchParams.delete('page');
		navigate(searchParams);
	}

	function removeFilterParams(key: string, value?: string) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.delete(key, value);
		searchParams.delete('page');
		navigate(searchParams);
	}
</script>

<div class="flex flex-col gap-2">
	<ButtonGroup.Root>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} size="icon" class={cn(showAsButtonGroup && 'border-r-0')}>
						{#if filterLength > 0}
							<FunnelDuotoneIcon />
						{:else}
							<FunnelIcon />
						{/if}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content class="w-fit">
				<DropdownMenu.Group>
					<DropdownMenu.Label class="py-0">
						{m.transaction_filter_title()}
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						onselect={() => {
							dialogType = 'category';
							dialogOpen = true;
						}}
					>
						{m.transaction_filter_category_title()}
					</DropdownMenu.Item>
					<DropdownMenu.Item
						onselect={() => {
							dialogType = 'notes';
							dialogOpen = true;
						}}
					>
						{m.transaction_filter_notes_title()}
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		{#if showAsButtonGroup}
			<ButtonGroup.Text class="bg-info/5 text-info">
				{m.transaction_filter_active({ value: filterLength })}
			</ButtonGroup.Text>

			<Button variant="destructive" size="icon" onclick={clearAllFilters}>
				<FunnelXDuotoneIcon />
			</Button>
		{/if}
	</ButtonGroup.Root>

	<FilterList
		{budgetId}
		categoryIds={categoryId}
		{notes}
		onOpenDialog={(type) => {
			dialogType = type;
			dialogOpen = true;
		}}
		onRemoveFilterParam={removeFilterParams}
	/>
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-w-120">
		{#if dialogType === 'category'}
			<FilterCategory
				{budgetId}
				currentCategoryIds={categoryId}
				onApply={(ids) => {
					setFilterParams({ categoryId: ids });
				}}
			>
				{#snippet header({ description, title })}
					<Dialog.Header>
						<Dialog.Title>{title}</Dialog.Title>
						<Dialog.Description>{description}</Dialog.Description>
					</Dialog.Header>
				{/snippet}

				{#snippet footer({ setParams })}
					<Dialog.Footer>
						<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.cancel()}</Dialog.Close>
						<Button
							onclick={() => {
								setParams();
								dialogOpen = false;
							}}
						>
							{m.use()}
						</Button>
					</Dialog.Footer>
				{/snippet}
			</FilterCategory>
		{:else if dialogType === 'notes'}
			<FilterNotes
				currentNotes={notes ?? undefined}
				onApply={(v) => {
					setFilterParams({ notes: v });
				}}
				onClose={() => (dialogOpen = false)}
			>
				{#snippet header({ description, title })}
					<Dialog.Header>
						<Dialog.Title>{title}</Dialog.Title>
						<Dialog.Description>{description}</Dialog.Description>
					</Dialog.Header>
				{/snippet}

				{#snippet footer({ setParams })}
					<Dialog.Footer>
						<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.cancel()}</Dialog.Close>
						<Button
							onclick={() => {
								setParams();
								dialogOpen = false;
							}}
						>
							{m.use()}
						</Button>
					</Dialog.Footer>
				{/snippet}
			</FilterNotes>
		{/if}
	</Dialog.Content>
</Dialog.Root>
