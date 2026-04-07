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
		name,
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

	function centToInternalInputValue(centValue: null | number) {
		if (centValue === null || centValue === undefined) {
			return '';
		}

		return (centValue / 100).toFixed(2);
	}

	function floatToCentValue(floatValue: null | number) {
		if (floatValue === null || floatValue === undefined || Number.isNaN(floatValue)) {
			return null;
		}

		return Math.round(floatValue * 100);
	}

	// Internal string value for CurrencyInput (library expects string)
	let internalValue = $state(centToInternalInputValue(value));
	let internalCentValue = $state<null | number>(value);

	// Keep internal value synchronized from canonical external cent state.
	$effect(() => {
		if (value === internalCentValue) {
			return;
		}

		const expectedInternalValue = centToInternalInputValue(value);

		if (internalValue !== expectedInternalValue) {
			internalValue = expectedInternalValue;
		}

		internalCentValue = value;
	});

	function handleInputValue(values: CurrencyInputValues) {
		internalValue = values.value;
		const nextCentValue = floatToCentValue(values.float);
		internalCentValue = nextCentValue;
		value = nextCentValue;
		oninputvalue?.(values);
	}

	function handleChangeValue(values: CurrencyInputValues) {
		internalValue = values.value;
		const nextCentValue = floatToCentValue(values.float);
		internalCentValue = nextCentValue;
		value = nextCentValue;
		onchangevalue?.(values);
	}
</script>

<CurrencyInput
	bind:ref
	value={internalValue}
	data-slot={dataSlot}
	class={cn(
		'h-9 w-full rounded-md border border-muted/30 bg-focus/3 px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:bg-focus/5 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
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

{#if name}
	<input
		type="hidden"
		{name}
		value={value === null || value === undefined ? '' : String(value)}
		disabled={restProps.disabled}
		form={restProps.form}
	/>
{/if}
