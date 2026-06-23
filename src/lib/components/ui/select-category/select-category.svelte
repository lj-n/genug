<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Combobox, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretUpDown from '~icons/ph/caret-up-down';
	import PhCheck from '~icons/ph/check';

	type Category = { id: string; name: string };

	const EMPTY_SENTINEL = '__empty__';

	let {
		categories,
		class: className,
		contentProps,
		inputProps,
		multiple = false,
		name,
		nullable = false,
		open = $bindable(false),
		placeholder = m.transaction_table_cell_category_placeholder(),
		textEmpty = m.transaction_table_cell_category_empty(),
		textNotFound = m.transaction_table_cell_category_not_found(),
		value = $bindable(undefined as string | string[] | undefined)
	}: {
		categories: Category[];
		class?: string;
		contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>;
		inputProps?: WithoutChildrenOrChild<Combobox.InputProps>;
		multiple?: boolean;
		name?: string;
		nullable?: boolean;
		open?: boolean;
		placeholder?: string;
		textEmpty?: string;
		textNotFound?: string;
		value?: string | string[] | undefined;
	} = $props();

	let searchValue = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);

	const items = $derived(
		nullable
			? [
					{ label: textEmpty, value: EMPTY_SENTINEL },
					...categories.map((c) => ({ label: c.name, value: c.id }))
				]
			: categories.map((c) => ({ label: c.name, value: c.id }))
	);

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

	/**
	 * Converts bits-ui combobox value to our external value.
	 * The EMPTY_SENTINEL is internal-only — it never leaks to the parent via `$bindable value`.
	 */
	function handleValueChange(v: string | string[] | undefined) {
		if (multiple) {
			const arr = Array.isArray(v) ? v.filter((id) => id !== EMPTY_SENTINEL) : [];
			(value as string[]) = arr;
		} else {
			(value as string | undefined) =
				typeof v === 'string' && v !== '' && v !== EMPTY_SENTINEL ? v : undefined;
		}
	}

	const displayValue = $derived(
		multiple
			? Array.isArray(value) && value.length > 0
				? m.transaction_filter_category_selected({ selected: value.length })
				: ''
			: typeof value === 'string' && value !== ''
				? (categories.find((c) => c.id === value)?.name ?? '')
				: ''
	);

	const placeholderText = $derived(multiple || value !== undefined ? placeholder : textEmpty);
</script>

<Combobox.Root
	type={multiple ? 'multiple' : 'single'}
	{items}
	bind:value={
		() => (multiple ? value : (value ?? EMPTY_SENTINEL)) as never, handleValueChange as never
	}
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
			class="h-full flex-1 border-0 bg-transparent px-2 py-1 outline-none placeholder:text-muted"
			placeholder={placeholderText}
			oninput={handleInput}
		/>
		<Combobox.Trigger class="flex h-full items-center px-2 text-muted hover:text-foreground">
			<PhCaretUpDown class="size-4" aria-hidden="true" />
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
		{#each filteredItems as item (item.value)}
			<Combobox.Item
				{...item}
				class="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-info/5 data-highlighted:text-info data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
			>
				{#snippet children({ selected })}
					<span class="absolute inset-e-2 flex size-3.5 items-center justify-center">
						{#if selected}
							<PhCheck aria-hidden="true" />
						{/if}
					</span>
					{item.label}
				{/snippet}
			</Combobox.Item>
		{:else}
			<span class="px-2 text-center text-sm text-muted">{textNotFound}</span>
		{/each}
	</Combobox.Content>
</Combobox.Root>

{#if name}
	{#if multiple && Array.isArray(value) && value.length > 0}
		{#each value as id (id)}
			<input type="hidden" {name} value={id} />
		{/each}
	{:else if !multiple}
		<input type="hidden" {name} value={typeof value === 'string' && value !== '' ? value : ''} />
	{/if}
{/if}
