<script lang="ts">
	import type { CurrencyInputValues, IntlConfig } from '@canutin/svelte-currency-input';
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { CurrencyInput } from '@canutin/svelte-currency-input';
	import { cn } from 'tailwind-variants';

	type Props = Omit<HTMLInputAttributes, 'value'> & {
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
		value?: string;
	};

	let {
		allowDecimals,
		allowNegativeValue,
		class: className,
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
		value = $bindable(),

		...restProps
	}: Props = $props();
</script>

<CurrencyInput
	bind:value
	bind:ref
	class={cn(
		'h-9 w-full rounded-md border border-muted/30 bg-surface px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 aria-invalid:border-error',
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
	{oninputvalue}
	{onchangevalue}
	{...restProps}
/>
