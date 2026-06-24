<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Combobox, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';
	import CheckIcon from '~icons/ph/check';

	type Category = { id: string; name: string };

	let {
		ariaLabel,
		categories,
		class: className,
		contentProps,
		inputProps,
		name,
		nullable = false,
		open = $bindable(false),
		placeholder = m.select_category_placeholder(),
		textEmpty = m.select_category_empty(),
		textNotFound = m.select_category_not_found(),
		value = $bindable('')
	}: {
		ariaLabel?: string;
		categories: Category[];
		class?: string;
		contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>;
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

	const NULL_VALUE = '__empty__';

	const showNullable = $derived(nullable && textEmpty.toLowerCase().includes(searchValue.toLowerCase()));

	const displayValue = $derived(
		value ? (categories.find((c) => c.id === value)?.name ?? '') : nullable ? textEmpty : ''
	);
</script>

{#snippet itemRow(args: { label: string; value: string })}
	<Combobox.Item
		value={args.value}
		label={args.label}
		class="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-info/5 data-highlighted:text-info data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
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
	bind:value={() => value || NULL_VALUE, (v) => {
		value = !v || v === NULL_VALUE ? '' : v;
	}}
	bind:open
	onOpenChange={handleOpenChange}
	inputValue={displayValue}
>
	<div
		bind:this={containerRef}
		class={cn(
			'flex h-9 w-full items-center rounded-md border border-muted/30 bg-surface/70 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/50',
			className
		)}
	>
		<Combobox.Input
			{...inputProps}
			aria-label={ariaLabel}
			class="h-full flex-1 border-0 bg-transparent px-2 py-1 outline-none placeholder:text-muted"
			{placeholder}
			oninput={handleInput}
		/>
		<Combobox.Trigger class="flex h-full items-center px-2 text-muted hover:text-foreground">
			<CaretUpDownIcon class="size-4" aria-hidden="true" />
		</Combobox.Trigger>
	</div>

	<Combobox.Content
		{...contentProps}
		customAnchor={containerRef}
		sideOffset={6}
		class={cn(
			'w-(--bits-combobox-anchor-width) overflow-hidden rounded-md bg-surface p-1 shadow-md ring-1 ring-muted/20',
			contentProps?.class
		)}
	>
		{#if showNullable}
			{@render itemRow({ label: textEmpty, value: NULL_VALUE })}
		{/if}

		{#each filteredItems as item (item.value)}
			{@render itemRow(item)}
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
