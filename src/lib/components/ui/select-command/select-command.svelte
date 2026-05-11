<script lang="ts" generics="Item extends { id: string, name: string }">
	import { Popover } from 'bits-ui';
	import { tick } from 'svelte';
	import PhCaretUpDown from '~icons/ph/caret-up-down';

	import { Button } from '../button';
	import * as Command from '../command';

	type SelectCommandProps = {
		items: Item[];
		open?: boolean;
		textEmptyTrigger?: string;
		textInputPlaceholder?: string;
		textListEmpty?: string;
		triggerProps?: Popover.TriggerProps;
		value?: string;
	};

	let {
		items,
		open = $bindable(false),
		textEmptyTrigger,
		textInputPlaceholder,
		textListEmpty,
		triggerProps,
		value = $bindable(undefined)
	}: SelectCommandProps = $props();

	let triggerRef = $state<HTMLButtonElement>(null!);

	const selectedValue = $derived(items.find((f) => f.id === value)?.name);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} {...triggerProps}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				class="w-full justify-between px-2"
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue || textEmptyTrigger}
				<PhCaretUpDown class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		class="w-full p-0"
		sideOffset={4}
		onkeydown={(ev) => {
			if (ev.key === 'Escape') {
				open = false;
				ev.stopPropagation();
			}
		}}
	>
		<Command.Root bind:value class="gap-1 shadow-lg" disablePointerSelection>
			<Command.Input placeholder={textInputPlaceholder} />
			<Command.List>
				<Command.Empty>{textListEmpty}</Command.Empty>
				<Command.Group value="categories">
					{#each items as item (item.id)}
						<Command.Item
							value={item.id}
							onSelect={() => {
								closeAndFocusTrigger();
							}}
						>
							{item.name}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
