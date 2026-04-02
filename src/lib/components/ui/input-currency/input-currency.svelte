<script lang="ts">
	import type { CurrencyInputValues, IntlConfig } from '@canutin/svelte-currency-input';
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { CurrencyInput } from '@canutin/svelte-currency-input';
	import { cn } from 'tailwind-variants';

	type Props = Omit<HTMLInputAttributes, 'onchangevalue' | 'oninputvalue' | 'value'> & {
		allowDecimals?: boolean;
		allowNegativeValue?: boolean;
		decimalScale?: number;
		decimalSeparator?: string;
		decimalsLimit?: number;
		disableAbbreviations?: boolean;
		disableGroupSeparators?: boolean;
		fixedDecimalLength?: number;
		formatValueOnBlur?: boolean;
		groupSeparator?: string;
		intlConfig?: IntlConfig;
		max?: number;
		maxLength?: number;
		min?: number;
		onchangevalue?: (values: CurrencyInputValues) => void;
		oninputvalue?: (values: CurrencyInputValues) => void;
		prefix?: string;
		ref?: HTMLInputElement | null;
		step?: number;
		suffix?: string;
		transformRawValue?: (value: string) => string;
		value?: null | number;
	};

	let {
		allowDecimals,
		allowNegativeValue,
		class: className,
		'data-slot': dataSlot = 'input',
		decimalScale,
		decimalSeparator,
		decimalsLimit,
		disableAbbreviations,
		disableGroupSeparators,
		fixedDecimalLength,
		formatValueOnBlur,
		groupSeparator,
		intlConfig,
		max,
		maxLength,
		min,
		onchangevalue,
		oninputvalue,
		prefix,
		ref = $bindable(null),
		step,
		suffix,
		transformRawValue,
		value = $bindable(null),
		...restProps
	}: Props = $props();

	// Internal string value for CurrencyInput (library expects string)
	let internalValue = $state(value !== null && value !== undefined ? String(value) : '');

	// Sync external number value changes to internal string
	$effect(() => {
		// Parse the current internal string to a float
		const currentFloat = internalValue === '' ? null : parseFloat(internalValue);

		// If external value differs from internal float, sync internal to external
		if (value !== currentFloat) {
			internalValue = value !== null && value !== undefined ? String(value) : '';
		}
	});

	function handleInputValue(values: CurrencyInputValues) {
		internalValue = values.value;
		value = values.float;
		oninputvalue?.(values);
	}

	function handleChangeValue(values: CurrencyInputValues) {
		internalValue = values.value;
		value = values.float;
		onchangevalue?.(values);
	}
</script>

<CurrencyInput
	bind:ref
	value={internalValue}
	data-slot={dataSlot}
	class={cn(
		'h-9 w-full rounded-md border border-muted/30 bg-focus-muted px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
		className
	)}
	{intlConfig}
	{prefix}
	{suffix}
	{decimalSeparator}
	{groupSeparator}
	{disableGroupSeparators}
	{allowDecimals}
	{decimalsLimit}
	{decimalScale}
	{fixedDecimalLength}
	{allowNegativeValue}
	{min}
	{max}
	{maxLength}
	{step}
	{disableAbbreviations}
	{formatValueOnBlur}
	{transformRawValue}
	oninputvalue={handleInputValue}
	onchangevalue={handleChangeValue}
	{...restProps}
/>
