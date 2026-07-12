import type { ComponentProps } from 'svelte';

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

import InputMoney from './input-money.svelte';

function renderNamedMoneyInput(props?: Partial<ComponentProps<typeof InputMoney>>) {
	render(InputMoney, {
		props: {
			currency: 'EUR',
			intlConfig: { locale: 'de-DE' },
			name: 'targetBalance',
			...props
		}
	});

	const input = screen.getByRole('textbox');
	const hidden = document.querySelector<HTMLInputElement>(
		'input[type="hidden"][name="targetBalance"]'
	);

	if (!hidden) {
		throw new Error('Expected hidden cent input to exist');
	}

	return { hidden, input };
}

describe('InputMoney cent binding', () => {
	it('keeps cent precision for comma-decimal locales', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput();

		await user.clear(input);
		await user.type(input, '12,34');
		flushSync();

		expect(hidden.value).toBe('1234');
	});

	it('keeps full cent precision when entering decimal amounts', async () => {
		const user = userEvent.setup();
		const { hidden, input } = renderNamedMoneyInput({
			currency: 'USD',
			intlConfig: { locale: 'en-US' }
		});

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

	it('renders a cent value as a decimal amount for display', () => {
		render(InputMoney, {
			props: {
				currency: 'EUR',
				intlConfig: { locale: 'de-DE' },
				value: 1234
			}
		});

		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toContain('12,34');
	});

	it('renders 0 cents as formatted "0,00"', () => {
		render(InputMoney, {
			props: {
				currency: 'EUR',
				intlConfig: { locale: 'de-DE' },
				value: 0
			}
		});

		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toContain('0');
	});

	it('submits cent integer value in form data', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(InputMoney, {
			props: {
				currency: 'EUR',
				intlConfig: { locale: 'de-DE' },
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

	it('submits empty string when value is NaN', () => {
		const form = document.createElement('form');
		document.body.append(form);

		render(InputMoney, {
			props: {
				currency: 'EUR',
				intlConfig: { locale: 'de-DE' },
				name: 'amount',
				value: NaN
			},
			target: form
		});

		const formData = new FormData(form);
		expect(formData.get('amount')).toBe('');
	});
});
