<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		value = $bindable(),
		...restProps
	}: ToggleGroupPrimitive.RootProps = $props();
</script>

<ToggleGroupPrimitive.Root
	bind:value={value as never}
	data-slot="toggle-group"
	class={cn(
		'inline-flex w-fit items-center gap-0.5 rounded-md border border-muted/20 bg-muted/5 p-0.5',
		className
	)}
	{...restProps}
/>
