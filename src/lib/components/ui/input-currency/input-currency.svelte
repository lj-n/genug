<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { CurrencyInputValues, IntlConfig } from '@canutin/svelte-currency-input';
	import type { HTMLInputAttributes } from 'svelte/elements';

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
		defaultValue?: number | string | undefined; // consumed (not forwarded)
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
		type?: string; // consumed (not forwarded)
		value?: null | number | string;
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
		defaultValue: _defaultValue, // consumed so field.as('number', 0) doesn't push it into restProps
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
		type: _type, // consumed so field.as('number') doesn't push it into restProps
		value = $bindable(null),
		...restProps
	}: Props = $props();

	function toCents(raw: null | number | string): null | number {
		if (raw === null || raw === undefined || raw === '') {
			return null;
		}
		if (typeof raw === 'number') {
			return Number.isNaN(raw) ? null : raw;
		}
		// string — treat as cent integer
		const n = Number(raw);
		return Number.isNaN(n) ? null : n;
	}

	function centToInternalInputValue(centValue: null | number | string) {
		const cents = toCents(centValue);
		if (cents === null) {
			return '';
		}
		return (cents / 100).toFixed(2);
	}

	function floatToCentValue(floatValue: null | number) {
		if (floatValue === null || floatValue === undefined || Number.isNaN(floatValue)) {
			return null;
		}
		return Math.round(floatValue * 100);
	}

	// Internal string value for CurrencyInput (library expects string)
	let internalValue = $state(centToInternalInputValue(value));
	let internalCentValue = $state<null | number>(toCents(value));

	// Keep internal value synchronized from canonical external cent state.
	$effect(() => {
		const resolved = toCents(value);
		if (resolved === internalCentValue) {
			return;
		}

		const expectedInternalValue = centToInternalInputValue(value);

		if (internalValue !== expectedInternalValue) {
			internalValue = expectedInternalValue;
		}

		internalCentValue = resolved;
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
		'h-9 w-full rounded-md border border-muted/30 bg-surface/70 px-3 py-1 outline-none placeholder:text-muted focus-visible:border-focus focus-visible:bg-surface/80 focus-visible:ring-2 focus-visible:ring-focus/50 aria-invalid:border-error',
		className
	)}
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
		value={value === null ||
		value === undefined ||
		(typeof value === 'number' && Number.isNaN(value))
			? ''
			: String(value)}
		disabled={restProps.disabled}
		form={restProps.form}
	/>
{/if}
