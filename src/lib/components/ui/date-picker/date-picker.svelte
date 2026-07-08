<script lang="ts">
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatDate } from '$lib/utils/format-date';
	import { type CalendarDate, getLocalTimeZone, today as getToday } from '@internationalized/date';
	import { Popover, type WithElementRef } from 'bits-ui';
	import { tick } from 'svelte';
	import { cn } from 'tailwind-variants';

	import { Button, type ButtonSize, type ButtonVariant } from '../button';
	import { Calendar } from '../calendar';

	type DatePickerProps = {
		ariaInvalid?: boolean;
		class?: string;
		disabled?: boolean;
		formatDisplay?: (date: CalendarDate) => string;
		label?: string;
		locale?: Locale;
		name?: string;
		open?: boolean;
		placeholder?: CalendarDate;
		ref?: HTMLButtonElement | null;
		size?: ButtonSize;
		value?: CalendarDate;
		variant?: ButtonVariant;
	};

	let {
		ariaInvalid,
		class: className,
		disabled = false,
		formatDisplay,
		label = 'Datum wählen',
		locale = getLocale(),
		name,
		open = $bindable(false),
		placeholder = getToday(getLocalTimeZone()),
		ref = $bindable(null),
		size = 'default',
		value = $bindable(undefined),
		variant = 'ghost',
		...restProps
	}: WithElementRef<DatePickerProps> = $props();

	const defaultFormatter = $derived((d: CalendarDate) =>
		formatDate({
			date: d,
			locale,
			options: {
				day: '2-digit',
				month: 'short',
				year: '2-digit'
			}
		})
	);

	const displayFormatter = $derived(formatDisplay ?? defaultFormatter);

	const displayValue = $derived(value ? displayFormatter(value) : label);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			ref?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref {disabled} {...restProps}>
		{#snippet child({ props })}
			<Button
				{...props}
				{variant}
				{size}
				{disabled}
				type="button"
				class={cn(
					'w-full justify-between border-muted/30 bg-surface/70 px-2 hover:cursor-text hover:bg-surface/70 aria-expanded:bg-surface/70 aria-expanded:ring-2 aria-expanded:ring-focus',
					className
				)}
				role="combobox"
				aria-expanded={open}
				aria-invalid={ariaInvalid}
				aria-label={value ? displayFormatter(value) : label}
			>
				{displayValue}
			</Button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		class="w-full p-0"
		sideOffset={4}
		onkeydown={(ev) => {
			if (ev.key === 'Escape') {
				closeAndFocusTrigger();
				ev.stopPropagation();
			}
		}}
	>
		<Calendar
			type="single"
			bind:value
			captionLayout="dropdown"
			{placeholder}
			{locale}
			onValueChange={closeAndFocusTrigger}
			class="rounded-xl border border-muted/30 bg-surface-high shadow"
		/>
	</Popover.Content>
</Popover.Root>

{#if name && value !== undefined}
	<input type="hidden" {name} value={value.toString()} />
{/if}
