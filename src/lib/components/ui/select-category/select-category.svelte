<script lang="ts">
	import type { Snippet } from 'svelte';

	import { inputVariants } from '$lib/components/ui/input';
	import { UNASSIGNED } from '$lib/constants';
	import { m } from '$lib/paraglide/messages';
	import { Combobox, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';
	import CheckIcon from '~icons/ph/check';

	type Category = { id: string; name: string };

	let {
		ariaInvalid,
		ariaLabel,
		ariaLabelTrigger,
		categories,
		class: className,
		contentProps,
		customItemRow,
		inputProps,
		name,
		nullable = false,
		open = $bindable(false),
		placeholder = m.select_category_placeholder(),
		textEmpty = m.select_category_empty(),
		textNotFound = m.select_category_not_found(),
		value = $bindable('')
	}: {
		ariaInvalid?: boolean;
		ariaLabel?: string;
		ariaLabelTrigger?: string;
		categories: Category[];
		class?: string;
		contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>;
		customItemRow?: Snippet<[{ label: string; value: string }]>;
		inputProps?: WithoutChildrenOrChild<Combobox.InputProps>;
		name?: string;
		nullable?: boolean;
		open?: boolean;
		placeholder?: string;
		textEmpty?: string;
		textNotFound?: string;
		value?: string;
	} = $props();

	let searchValue = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);

	const items = $derived(categories.map((c) => ({ label: c.name, value: c.id })));

	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
	);

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		searchValue = e.currentTarget.value;
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) searchValue = '';
	}

	const showNullable = $derived(
		nullable && textEmpty.toLowerCase().includes(searchValue.toLowerCase())
	);

	const displayValue = $derived(
		value ? (categories.find((c) => c.id === value)?.name ?? '') : nullable ? textEmpty : ''
	);
</script>

{#snippet itemRow(args: { label: string; value: string })}
	<Combobox.Item
		value={args.value}
		label={args.label}
		class="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-muted/10 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	>
		{#snippet children({ selected })}
			<span class="absolute inset-e-2 flex size-3.5 items-center justify-center">
				{#if selected}
					<CheckIcon aria-hidden="true" />
				{/if}
			</span>
			{args.label}
		{/snippet}
	</Combobox.Item>
{/snippet}

<Combobox.Root
	type="single"
	{items}
	bind:value={
		() => value || UNASSIGNED,
		(v) => {
			value = !v || v === UNASSIGNED ? '' : v;
		}
	}
	bind:open
	onOpenChange={handleOpenChange}
	inputValue={displayValue}
>
	<div
		bind:this={containerRef}
		class={cn(inputVariants({ variant: 'container' }), className)}
		aria-invalid={ariaInvalid}
	>
		<Combobox.Input
			{...inputProps}
			aria-invalid={ariaInvalid}
			aria-label={ariaLabel}
			class="h-full flex-1 border-0 bg-transparent px-2 py-1 outline-none placeholder:text-muted focus-visible:ring-0"
			{placeholder}
			oninput={handleInput}
		/>
		<Combobox.Trigger
			class="flex h-full items-center px-2 text-muted hover:text-foreground"
			aria-label={ariaLabelTrigger}
		>
			<CaretUpDownIcon class="size-4" aria-hidden="true" />
		</Combobox.Trigger>
	</div>

	<Combobox.Content
		{...contentProps}
		customAnchor={containerRef}
		sideOffset={6}
		class={cn(
			'w-(--bits-combobox-anchor-width) overflow-hidden rounded-md bg-surface-high p-1 shadow-md ring-1 ring-muted/20',
			contentProps?.class
		)}
	>
		{#if showNullable}
			{#if customItemRow}
				{@render customItemRow({ label: textEmpty, value: UNASSIGNED })}
			{:else}
				{@render itemRow({ label: textEmpty, value: UNASSIGNED })}
			{/if}
		{/if}

		{#each filteredItems as item (item.value)}
			{#if customItemRow}
				{@render customItemRow(item)}
			{:else}
				{@render itemRow(item)}
			{/if}
		{:else}
			{#if !showNullable}
				<span class="px-2 text-center text-sm text-muted">{textNotFound}</span>
			{/if}
		{/each}
	</Combobox.Content>
</Combobox.Root>

{#if name}
	<input type="hidden" {name} {value} />
{/if}
