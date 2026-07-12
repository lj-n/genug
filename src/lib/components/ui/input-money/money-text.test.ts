import { describe, expect, it } from 'vitest';

import {
	centsToEditText,
	decimalSeparatorFor,
	editTextToCents,
	isValidEditText,
	parsePastedAmount
} from './money-text';

describe('isValidEditText', () => {
	it.each([
		['', true],
		['-', true],
		['0', true],
		['1234', true],
		['12,3', true],
		['12,34', true],
		['12.34', true],
		[',5', true],
		['-12,34', true],
		['12,345', false],
		['12.345', false],
		['1.234,56', false],
		['12,3,4', false],
		['12,3.4', false],
		['1-2', false],
		['12-', false],
		['--12', false],
		['abc', false],
		['12 34', false],
		['12,34 €', false]
	])('%j → %s', (text, valid) => {
		expect(isValidEditText(text)).toBe(valid);
	});
});

describe('editTextToCents', () => {
	it.each([
		['', 0],
		['-', 0],
		['0', 0],
		['200', 20000],
		['12,34', 1234],
		['12.34', 1234],
		['12,3', 1230],
		['12,', 1200],
		[',5', 50],
		[',05', 5],
		['-12,34', -1234],
		['-0', 0],
		['-,', 0]
	])('%j → %d', (text, cents) => {
		expect(editTextToCents(text)).toBe(cents);
	});
});

describe('centsToEditText', () => {
	it.each([
		[0, ',', '0'],
		[20000, ',', '200'],
		[1234, ',', '12,34'],
		[1234, '.', '12.34'],
		[1230, ',', '12,30'],
		[5, ',', '0,05'],
		[-1234, ',', '-12,34'],
		[-20000, ',', '-200']
	])('%d with %j → %j', (cents, separator, text) => {
		expect(centsToEditText(cents, separator)).toBe(text);
	});
});

describe('decimalSeparatorFor', () => {
	it.each([
		['de', ','],
		['en', '.']
	] as const)('%s → %j', (locale, separator) => {
		expect(decimalSeparatorFor(locale)).toBe(separator);
	});
});

describe('parsePastedAmount', () => {
	it.each([
		// single separator: decimal when followed by 1–2 digits
		['1.23', 123],
		['1,23', 123],
		['12.5', 1250],
		// single separator followed by 3 digits is a group separator
		['1.234', 123400],
		['1,234', 123400],
		// repeated single-kind separators group thousands
		['1.234.567', 123456700],
		// both separators: the last one is the decimal separator
		['1.234,56', 123456],
		['1,234.56', 123456],
		['1.234.567,89', 123456789],
		// symbols, spaces, and sign are tolerated
		['1.234,56 €', 123456],
		['€1,234.56', 123456],
		['EUR 1 234,56', 123456],
		['-12,34', -1234],
		['- 12,34 €', -1234],
		['42', 4200],
		['12.', 1200],
		// unparseable
		['', null],
		['abc', null],
		['.', null],
		['-', null],
		['1,234.567', null]
	])('%j → %o', (text, cents) => {
		expect(parsePastedAmount(text)).toBe(cents);
	});
});
