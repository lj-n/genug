<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	export type CommandRootApi = CommandPrimitive.Root;

	let {
		api = $bindable(null),
		class: className,
		ref = $bindable(null),
		value = $bindable(''),
		...restProps
	}: CommandPrimitive.RootProps & {
		api?: CommandRootApi | null;
	} = $props();
</script>

<CommandPrimitive.Root
	bind:this={api}
	bind:value
	bind:ref
	data-slot="command"
	class={cn(
		'flex size-full flex-col overflow-hidden rounded-xl! border border-muted/20 bg-surface-high p-1 in-data-[slot=dialog-content]:border-none',
		className
	)}
	{...restProps}
/>
