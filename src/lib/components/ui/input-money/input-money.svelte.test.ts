import type { ComponentProps } from 'svelte';

import { asMoney, formatMoney } from '$lib/utils/money';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync, tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import InputMoney from './input-money.svelte';

function formatted(cents: number): string {
	return formatMoney({ currency: 'EUR', money: asMoney(cents) });
}

function renderNamedMoneyInput(props?: Partial<ComponentProps<typeof InputMoney>>) {
	render(InputMoney, {
		props: {
			currency: 'EUR',
			name: 'targetBalance',
			...props
		}
	});

	const input = screen.getByRole<HTMLInputElement>('textbox');
	const hidden = document.querySelector<HTMLInputElement>(
		'input[type="hidden"][name="targetBalance"]'
	);

	if (!hidden) {
		throw new Error('Expected hidden cent input to exist');
	}

	return { hidden, input };
}

describe('InputMoney cent binding', () => {
	it('keeps cent precision for comma-decimal entry', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '12,34');
		flushSync();

		expect(hidden.value).toBe('1234');
	});

	it('keeps cent precision for dot-decimal entry', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput({ currency: 'USD' });

		await user.clear(input);
		await user.type(input, '12.34');
		flushSync();

		expect(hidden.value).toBe('1234');
	});

	it('keeps cent precision when replacing an existing amount', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput({ value: 1234 });

		await user.clear(input);
		await user.type(input, '56,78');
		flushSync();

		expect(hidden.value).toBe('5678');
	});

	it('propagates 0 cents when the input is cleared', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput({ value: 40000 });

		await user.clear(input);
		flushSync();

		expect(hidden.value).toBe('0');
	});

	it('updates the hidden input on every keystroke', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.click(input);
		await user.keyboard('4');
		flushSync();
		expect(hidden.value).toBe('400');

		await user.keyboard('2');
		flushSync();
		expect(hidden.value).toBe('4200');
	});

	it('submits 0 as a valid integer string before any interaction', () => {
		const { hidden } = renderNamedMoneyInput();

		expect(hidden.value).toBe('0');
	});

	it('accepts a leading minus for negative amounts', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '-12,34');
		flushSync();

		expect(hidden.value).toBe('-1234');
	});

	it('submits cent integer value in form data', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(InputMoney, {
			props: {
				currency: 'EUR',
				name: 'targetBalance'
			},
			target: form
		});

		const input = screen.getByRole('textbox');

		await user.clear(input);
		await user.type(input, '999,55');
		flushSync();

		const formData = new FormData(form);
		expect(formData.get('targetBalance')).toBe('99955');
	});
});

describe('InputMoney keystroke filter', () => {
	it('rejects a third decimal digit', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '12,345');
		flushSync();

		expect(input.value).toBe('12,34');
		expect(hidden.value).toBe('1234');
	});

	it('rejects a second decimal separator', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '1,2.3');
		flushSync();

		expect(input.value).toBe('1,23');
		expect(hidden.value).toBe('123');
	});

	it('rejects letters and a non-leading minus', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '1a2-3');
		flushSync();

		expect(input.value).toBe('123');
		expect(hidden.value).toBe('12300');
	});
});

describe('InputMoney display', () => {
	it('renders the bound cents formatted with currency symbol while unfocused', () => {
		renderNamedMoneyInput({ value: 1234 });

		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toBe(formatted(1234));
	});

	it('shows plain edit text while focused and reformats on blur', async () => {
		const user = userEvent.setup();
		const { input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '200');
		flushSync();
		expect(input.value).toBe('200');

		await user.tab();
		flushSync();
		expect(input.value).toBe(formatted(20000));
	});

	it('shows formatted zero after clearing and blurring', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput({ value: 40000 });

		await user.clear(input);
		await user.tab();
		flushSync();

		expect(input.value).toBe(formatted(0));
		expect(hidden.value).toBe('0');
	});

	it('selects the current text on focus when selectOnFocus is set', async () => {
		const user = userEvent.setup();
		const { input } = renderNamedMoneyInput({ selectOnFocus: true, value: 1234 });

		await user.click(input);
		await tick();

		expect(input.selectionStart).toBe(0);
		expect(input.selectionEnd).toBe(input.value.length);
	});
});

describe('InputMoney paste', () => {
	it('understands pasted currency strings with symbols and group separators', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.paste('1.234,56 €');
		flushSync();

		expect(hidden.value).toBe('123456');
	});

	it('treats a pasted single separator followed by three digits as grouping', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.paste('1.234');
		flushSync();

		expect(hidden.value).toBe('123400');
	});

	it('inserts plain decimal pastes at the caret', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.paste('12,34');
		flushSync();

		expect(input.value).toBe('12,34');
		expect(hidden.value).toBe('1234');
	});

	it('ignores unparseable pastes', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '42');
		await user.paste('not a number');
		flushSync();

		expect(input.value).toBe('42');
		expect(hidden.value).toBe('4200');
	});
});
