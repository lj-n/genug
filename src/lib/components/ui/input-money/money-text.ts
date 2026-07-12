/**
 * Text rules for the InputMoney editing model: what may appear in the
 * focused input, how edit text maps to integer cents, and how pasted
 * currency strings are understood. Widget concern — deliberately separate
 * from the domain money utils (`$lib/utils/money`), which own the branded
 * `Money` type.
 */

const EDIT_TEXT_PATTERN = /^(-?)(\d*)(?:[.,](\d{0,2}))?$/;

/** Minimal edit representation: no grouping, decimals only when non-zero. */
export function centsToEditText(cents: number, decimalSeparator: string): string {
	const sign = cents < 0 ? '-' : '';
	const absolute = Math.abs(cents);
	const whole = Math.trunc(absolute / 100);
	const fraction = absolute % 100;
	if (fraction === 0) {
		return `${sign}${whole}`;
	}
	return `${sign}${whole}${decimalSeparator}${String(fraction).padStart(2, '0')}`;
}

export function decimalSeparatorFor(locale: string): string {
	const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
	return parts.find((part) => part.type === 'decimal')?.value ?? '.';
}

/** Empty text and a bare minus parse to 0; a trailing separator counts as ",00". */
export function editTextToCents(text: string): number {
	const match = EDIT_TEXT_PATTERN.exec(text);
	if (!match) {
		return 0;
	}
	const [, sign, whole = '', fraction = ''] = match;
	const cents = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
	return sign === '-' && cents !== 0 ? -cents : cents;
}

/** Digits, one leading minus, one decimal separator (`,` or `.`), max 2 decimals. */
export function isValidEditText(text: string): boolean {
	return EDIT_TEXT_PATTERN.test(text);
}

/**
 * Tolerant parser for pasted currency strings (`1.234,56 €`). Strips symbols
 * and spaces; when both `.` and `,` appear the last one is the decimal
 * separator; a lone separator is decimal when followed by 1–2 digits and a
 * group separator when followed by 3. Returns null for unparseable input.
 */
export function parsePastedAmount(text: string): null | number {
	const cleaned = text.replace(/[^\d.,-]/g, '');
	const unsigned = cleaned.replace(/-/g, '');
	if (!/^[\d.,]+$/.test(unsigned) || !/\d/.test(unsigned)) {
		return null;
	}

	const decimalIndex = resolveDecimalSeparator(unsigned);
	if (decimalIndex === 'unparseable') {
		return null;
	}

	const [whole, fraction] =
		decimalIndex === null
			? [unsigned, '']
			: [unsigned.slice(0, decimalIndex), unsigned.slice(decimalIndex + 1)];
	if (fraction.length > 2) {
		return null;
	}

	const cents = Number(whole.replace(/[.,]/g, '') || '0') * 100 + Number(fraction.padEnd(2, '0'));
	if (!Number.isSafeInteger(cents)) {
		return null;
	}
	return cleaned.includes('-') && cents !== 0 ? -cents : cents;
}

/** Index of the decimal separator, null when every separator groups thousands. */
function resolveDecimalSeparator(unsigned: string): 'unparseable' | null | number {
	const lastDot = unsigned.lastIndexOf('.');
	const lastComma = unsigned.lastIndexOf(',');
	if (lastDot === -1 && lastComma === -1) {
		return null;
	}
	if (lastDot !== -1 && lastComma !== -1) {
		return Math.max(lastDot, lastComma);
	}

	const kind = lastDot !== -1 ? '.' : ',';
	const index = Math.max(lastDot, lastComma);
	// the same separator repeated can only group thousands ("1.234.567")
	if (unsigned.indexOf(kind) !== index) {
		return null;
	}
	const digitsAfter = unsigned.length - index - 1;
	if (digitsAfter === 3) {
		return null;
	}
	// a trailing separator ("12.") carries no decimals
	if (digitsAfter === 0) {
		return null;
	}
	return digitsAfter <= 2 ? index : 'unparseable';
}
