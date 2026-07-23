<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		inset,
		ref = $bindable(null),
		variant = 'default',
		...restProps
	}: DropdownMenuPrimitive.ItemProps & {
		inset?: boolean;
		variant?: 'default' | 'destructive' | 'interactive';
	} = $props();
</script>

<DropdownMenuPrimitive.Item
	bind:ref
	data-slot="dropdown-menu-item"
	data-inset={inset}
	data-variant={variant}
	class={cn(
		"group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-muted/10 focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		'data-[variant=destructive]:text-error data-[variant=destructive]:focus:bg-error/5 data-[variant=destructive]:focus:text-error data-[variant=destructive]:*:[svg]:text-error',
		'data-[variant=interactive]:text-interactive data-[variant=interactive]:focus:text-interactive data-[variant=interactive]:*:[svg]:text-interactive',
		className
	)}
	{...restProps}
/>
