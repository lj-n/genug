import { getLocale, type Locale } from '$lib/paraglide/runtime';
import { NumberFormatter } from '@internationalized/number';
import * as v from 'valibot';

import type { CURRENCIES } from './currencies';

declare const MoneyBrand: unique symbol;

/**
 * A quantity of currency stored as an integer count of the smallest unit
 * (cents for EUR/USD). Obtain values via `parseMoney` or `MoneySchema`;
 * never by casting.
 */
export type Money = number & { readonly [MoneyBrand]: true };

export function addMoney(money: Money, delta: number): Money {
	return (unwrapMoney(money) + delta) as Money;
}

export function formatMoney({
	currency,
	locale = getLocale(),
	money,
	options
}: {
	currency: (typeof CURRENCIES)[number];
	locale?: Locale;
	money: Money;
	options?: Intl.NumberFormatOptions;
}): string {
	const float = unwrapMoney(money) / 100;
	return new NumberFormatter(locale, {
		currency,
		style: 'currency',
		...options
	}).format(float);
}

export function parseMoney(value: number | string): Money | null {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	return isValidMoney(num) ? (num as Money) : null;
}

export function subtractMoney(money: Money, delta: number): Money {
	return (unwrapMoney(money) - delta) as Money;
}

export function unwrapMoney(money: Money): number {
	return money;
}

function isValidMoney(value: number): boolean {
	return Number.isInteger(value) && Number.isFinite(value);
}

export const MoneySchema = v.pipe(
	v.number(),
	v.integer(),
	v.check((value) => parseMoney(value) !== null),
	v.transform((value) => value as Money)
);
