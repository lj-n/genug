<script lang="ts" generics="Item extends { id: string, name: string }">
	import { Popover, type WithElementRef } from 'bits-ui';
	import { tick } from 'svelte';
	import PhCaretUpDown from '~icons/ph/caret-up-down';

	import { Button } from '../button';
	import * as Command from '../command';

	type SelectCommandProps = {
		items: Item[];
		name?: string;
		open?: boolean;
		textEmptyTrigger?: string;
		textInputPlaceholder?: string;
		textListEmpty?: string;
		triggerProps?: Popover.TriggerProps;
		value?: string;
	};

	let {
		items,
		name,
		open = $bindable(false),
		ref = $bindable(null),
		textEmptyTrigger,
		textInputPlaceholder,
		textListEmpty,
		triggerProps,
		value = $bindable(undefined)
	}: WithElementRef<SelectCommandProps> = $props();

	const selectedValue = $derived(items.find((f) => f.id === value)?.name);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			ref?.focus();
		});
	}
</script>

{#if value}
	<input type="hidden" {name} {value} />
{/if}

<Popover.Root bind:open>
	<Popover.Trigger bind:ref {...triggerProps}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				class="w-full justify-between border-muted/30 bg-surface/70 px-2 hover:cursor-text hover:bg-surface/70 aria-expanded:border-focus aria-expanded:bg-surface/70 aria-expanded:ring-2 aria-expanded:ring-focus/50"
				role="combobox"
				aria-expanded={open}
			>
				{selectedValue ?? textEmptyTrigger}
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
				<Command.Group>
					<Command.Item value={undefined} onSelect={closeAndFocusTrigger}>
						{textEmptyTrigger}
					</Command.Item>

					{#each items as item (item.id)}
						<Command.Item value={item.id} onSelect={closeAndFocusTrigger}>
							{item.name}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
