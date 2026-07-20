<script lang="ts">
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CalendarPrimitive.DayProps = $props();
</script>

<CalendarPrimitive.Day
	bind:ref
	class={cn(
		'flex size-(--cell-size) flex-col items-center justify-center gap-1 rounded-(--cell-radius) p-0 leading-none font-normal whitespace-nowrap select-none',
		'[&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)',
		'not-data-selected:hover:bg-muted/10 not-data-selected:hover:text-foreground',
		'[&[data-today]:not([data-selected])]:bg-muted/5 [&[data-today]:not([data-selected])]:text-foreground [&[data-today][data-disabled]]:text-muted',
		'data-selected:bg-info/10 data-selected:text-info data-selected:hover:text-foreground',
		'[&[data-outside-month]:not([data-selected])]:text-muted [&[data-outside-month]:not([data-selected])]:hover:text-foreground',
		'data-disabled:pointer-events-none data-disabled:text-muted data-disabled:opacity-50',
		'data-unavailable:text-muted data-unavailable:line-through',
		'focus:relative',
		'[&>span]:text-xs [&>span]:opacity-70',
		className
	)}
	{...restProps}
/>
