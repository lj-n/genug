<script lang="ts">
	import { Calendar as CalendarPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretDown from '~icons/ph/caret-down';

	import { focusRingWithin } from '../focus-ring';

	let {
		class: className,
		onchange,
		ref = $bindable(null),
		value,
		...restProps
	}: WithoutChildrenOrChild<CalendarPrimitive.MonthSelectProps> = $props();
</script>

<span class={cn(`relative flex rounded-md border border-muted/20 ${focusRingWithin}`, className)}>
	<CalendarPrimitive.MonthSelect
		bind:ref
		class="absolute inset-0 bg-background opacity-0"
		{...restProps}
	>
		{#snippet child({ monthItems, props, selectedMonthItem })}
			<select {...props} {value} {onchange}>
				{#each monthItems as monthItem (monthItem.value)}
					<option
						value={monthItem.value}
						selected={value !== undefined
							? monthItem.value === value
							: monthItem.value === selectedMonthItem.value}
					>
						{monthItem.label}
					</option>
				{/each}
			</select>
			<span
				class="flex h-(--cell-size) items-center gap-1 rounded-md ps-2 pe-1 text-sm font-medium select-none [&>svg]:size-3.5 [&>svg]:text-muted"
				aria-hidden="true"
			>
				{monthItems.find((item) => item.value === value)?.label || selectedMonthItem.label}
				<PhCaretDown class={cn('size-4', className)} />
			</span>
		{/snippet}
	</CalendarPrimitive.MonthSelect>
</span>
