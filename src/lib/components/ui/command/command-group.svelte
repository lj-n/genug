<script lang="ts">
	import { Command as CommandPrimitive, useId } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		heading,
		ref = $bindable(null),
		value,
		...restProps
	}: CommandPrimitive.GroupProps & {
		heading?: string;
	} = $props();
</script>

<CommandPrimitive.Group
	bind:ref
	data-slot="command-group"
	class={cn(
		'overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted',
		className
	)}
	value={value ?? heading ?? `----${useId()}`}
	{...restProps}
>
	{#if heading}
		<CommandPrimitive.GroupHeading class="px-2 py-1.5 text-xs font-medium text-muted">
			{heading}
		</CommandPrimitive.GroupHeading>
	{/if}
	<CommandPrimitive.GroupItems {children} />
</CommandPrimitive.Group>
