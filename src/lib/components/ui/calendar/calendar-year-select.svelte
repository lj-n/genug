<script lang="ts">
	import type { WithoutChildrenOrChild } from 'bits-ui';

	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretDown from '~icons/ph/caret-down';

	import { focusRingWithin } from '../focus-ring';

	let {
		class: className,
		ref = $bindable(null),
		value,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> = $props();
</script>

<span
	class={cn(
		`relative flex rounded-md border border-muted/20 shadow-xs ${focusRingWithin}`,
		className
	)}
>
	<CalendarPrimitive.YearSelect bind:ref class="absolute inset-0 opacity-0" {...restProps}>
		{#snippet child({ props, selectedYearItem, yearItems })}
			<select {...props} {value}>
				{#each yearItems as yearItem (yearItem.value)}
					<option
						value={yearItem.value}
						selected={value !== undefined
							? yearItem.value === value
							: yearItem.value === selectedYearItem.value}
					>
						{yearItem.label}
					</option>
				{/each}
			</select>
			<span
				class="flex h-(--cell-size) items-center gap-1 rounded-md ps-2 pe-1 text-sm font-medium select-none [&>svg]:size-3.5 [&>svg]:text-muted"
				aria-hidden="true"
			>
				{yearItems.find((item) => item.value === value)?.label || selectedYearItem.label}
				<PhCaretDown class={cn('size-4', className)} />
			</span>
		{/snippet}
	</CalendarPrimitive.YearSelect>
</span>
