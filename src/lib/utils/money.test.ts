import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import {
	addMoney,
	formatMoney,
	MoneySchema,
	parseMoney,
	subtractMoney,
	unwrapMoney
} from './money';

describe('parseMoney', () => {
	it('accepts a positive cent integer', () => {
		expect(parseMoney(1234)).toBe(1234);
	});

	it('accepts a string cent value', () => {
		expect(parseMoney('1234')).toBe(1234);
	});

	it('accepts zero', () => {
		expect(parseMoney(0)).toBe(0);
	});

	it('accepts negative values', () => {
		expect(parseMoney(-5000)).toBe(-5000);
	});

	it('rejects a float', () => {
		expect(parseMoney(12.34)).toBeNull();
	});

	it('rejects a display string with decimal separator', () => {
		expect(parseMoney('12.34')).toBeNull();
	});

	it('rejects NaN', () => {
		expect(parseMoney(NaN)).toBeNull();
	});

	it('rejects Infinity', () => {
		expect(parseMoney(Infinity)).toBeNull();
	});

	it('rejects -Infinity', () => {
		expect(parseMoney(-Infinity)).toBeNull();
	});

	it('rejects empty string', () => {
		expect(parseMoney('')).toBeNull();
	});

	it('rejects non-numeric string', () => {
		expect(parseMoney('abc')).toBeNull();
	});
});

describe('parseMoney ↔ unwrapMoney roundtrip', () => {
	it('preserves the cent value through parse → unwrap', () => {
		for (let cents = -100000; cents <= 100000; cents++) {
			const money = parseMoney(cents);
			expect(money).not.toBeNull();
			expect(unwrapMoney(money!)).toBe(cents);
		}
	});

	it('preserves the Money value through unwrap → parse', () => {
		for (let cents = -50000; cents <= 50000; cents += 7) {
			const money = parseMoney(cents)!;
			const roundtripped = parseMoney(unwrapMoney(money));
			expect(roundtripped).not.toBeNull();
			expect(unwrapMoney(roundtripped!)).toBe(unwrapMoney(money));
		}
	});
});

describe('addMoney', () => {
	it('adds positive amounts', () => {
		expect(addMoney(parseMoney(1000)!, 500)).toBe(1500);
	});

	it('adds negative deltas', () => {
		expect(addMoney(parseMoney(1000)!, -300)).toBe(700);
	});

	it('crosses zero', () => {
		const result = addMoney(parseMoney(300)!, -500);
		expect(unwrapMoney(result)).toBe(-200);
	});

	it('matches plain integer addition across a test grid', () => {
		const testValues = [-5000, -1234, 0, 1, 9999, 100000];
		for (const a of testValues) {
			for (const b of testValues) {
				expect(unwrapMoney(addMoney(parseMoney(a)!, b))).toBe(a + b);
			}
		}
	});
});

describe('subtractMoney', () => {
	it('subtracts positive amounts', () => {
		expect(subtractMoney(parseMoney(1000)!, 300)).toBe(700);
	});

	it('subtracts negative deltas', () => {
		expect(subtractMoney(parseMoney(1000)!, -500)).toBe(1500);
	});

	it('matches plain integer subtraction across a test grid', () => {
		const testValues = [-5000, -1234, 0, 1, 9999, 100000];
		for (const a of testValues) {
			for (const b of testValues) {
				expect(unwrapMoney(subtractMoney(parseMoney(a)!, b))).toBe(a - b);
			}
		}
	});
});

describe('formatMoney', () => {
	it('formats EUR in de-DE', () => {
		expect(formatMoney({ currency: 'EUR', locale: 'de', money: parseMoney(1234)! })).toBe(
			'12,34 €'
		);
	});

	it('formats negative values', () => {
		expect(formatMoney({ currency: 'EUR', locale: 'de', money: parseMoney(-500)! })).toBe(
			'-5,00 €'
		);
	});

	it('formats zero', () => {
		expect(formatMoney({ currency: 'USD', locale: 'en', money: parseMoney(0)! })).toBe('$0.00');
	});
});

describe('MoneySchema', () => {
	it('accepts a valid cent integer', () => {
		expect(v.parse(MoneySchema, 1234)).toBe(1234);
	});

	it('accepts zero', () => {
		expect(v.parse(MoneySchema, 0)).toBe(0);
	});

	it('accepts negative values', () => {
		expect(v.parse(MoneySchema, -5000)).toBe(-5000);
	});

	it('rejects floats', () => {
		expect(v.safeParse(MoneySchema, 12.34).success).toBe(false);
	});

	it('rejects Infinity', () => {
		expect(v.safeParse(MoneySchema, Infinity).success).toBe(false);
	});

	it('rejects NaN', () => {
		expect(v.safeParse(MoneySchema, NaN).success).toBe(false);
	});

	it('rejects strings', () => {
		expect(v.safeParse(MoneySchema, '1234').success).toBe(false);
	});
});

describe('unwrapMoney', () => {
	it('returns the plain cent integer', () => {
		const money = parseMoney(1234)!;
		expect(unwrapMoney(money)).toBe(1234);
	});

	it('returns negative values correctly', () => {
		const money = parseMoney(-999)!;
		expect(unwrapMoney(money)).toBe(-999);
	});
});
