<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { CurrencyInputValues, IntlConfig } from '@canutin/svelte-currency-input';
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { inputVariants } from '$lib/components/ui/input';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { CurrencyInput } from '@canutin/svelte-currency-input';
	import { cn } from 'tailwind-variants';

	type Props = Omit<
		HTMLInputAttributes,
		'defaultValue' | 'onchangevalue' | 'oninputvalue' | 'type' | 'value'
	> & {
		allowDecimals?: boolean;
		allowNegativeValue?: boolean;
		currency: (typeof CURRENCIES)[number];
		decimalScale?: number;
		decimalSeparator?: string;
		decimalsLimit?: number;
		disableAbbreviations?: boolean;
		disableGroupSeparators?: boolean;
		fixedDecimalLength?: number;
		formatValueOnBlur?: boolean;
		groupSeparator?: string;
		intlConfig?: IntlConfig;
		locale?: Locale;
		max?: number;
		maxLength?: number;
		min?: number;
		onchangevalue?: (values: CurrencyInputValues) => void;
		oninputvalue?: (values: CurrencyInputValues) => void;
		prefix?: string;
		ref?: HTMLInputElement | null;
		selectOnFocus?: boolean;
		step?: number;
		suffix?: string;
		transformRawValue?: (value: string) => string;
		value?: null | number;
	};

	let {
		allowDecimals,
		allowNegativeValue,
		class: className,
		currency,
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
		locale = getLocale(),
		max,
		maxLength,
		min,
		name,
		onchangevalue,
		onfocus,
		oninputvalue,
		prefix,
		ref = $bindable(null),
		selectOnFocus = false,
		step,
		suffix,
		transformRawValue,
		value = $bindable(),
		...restProps
	}: Props = $props();

	function normalizeCents(cents: null | number | undefined): null | number {
		return cents === null || cents === undefined || Number.isNaN(cents) ? null : cents;
	}

	function centsToInputValue(cents: null | number | undefined): string {
		const normalized = normalizeCents(cents);
		return normalized === null ? '' : (normalized / 100).toFixed(2);
	}

	function floatToCents(floatValue: null | number): number {
		if (floatValue === null || floatValue === undefined || Number.isNaN(floatValue)) {
			return 0;
		}
		return Math.round(floatValue * 100);
	}

	// Internal string value for CurrencyInput (library expects string)
	let internalValue = $state(centsToInputValue(value));
	let internalCentValue = $state<null | number>(normalizeCents(value));

	// Keep internal value synchronized from canonical external cent state.
	$effect(() => {
		const resolved = normalizeCents(value);
		if (resolved === internalCentValue) {
			return;
		}

		const expectedInternalValue = centsToInputValue(value);

		if (internalValue !== expectedInternalValue) {
			internalValue = expectedInternalValue;
		}

		internalCentValue = resolved;
	});

	function handleInputValue(values: CurrencyInputValues) {
		internalValue = values.value;
		const nextCentValue = floatToCents(values.float);
		internalCentValue = nextCentValue;
		value = nextCentValue;
		oninputvalue?.(values);
	}

	function handleChangeValue(values: CurrencyInputValues) {
		internalValue = values.value;
		const nextCentValue = floatToCents(values.float);
		internalCentValue = nextCentValue;
		value = nextCentValue;
		onchangevalue?.(values);
	}
</script>

<CurrencyInput
	bind:ref
	value={internalValue}
	data-slot={dataSlot}
	class={cn(inputVariants(), className)}
	intlConfig={{ currency, locale, ...intlConfig }}
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
	onfocus={(ev) => {
		if (selectOnFocus) {
			ref?.select();
		}
		if (onfocus) {
			onfocus(ev);
		}
	}}
	{...restProps}
/>

{#if name}
	<input
		type="hidden"
		{name}
		value={normalizeCents(value) === null ? '' : String(value)}
		disabled={restProps.disabled}
		form={restProps.form}
	/>
{/if}
