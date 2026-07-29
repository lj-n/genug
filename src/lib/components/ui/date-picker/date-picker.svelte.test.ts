import type { ComponentProps } from 'svelte';

import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
	vi.runAllTimers();
	vi.useRealTimers();
});

import DatePicker from './date-picker.svelte';

function renderDatePicker(props?: Partial<ComponentProps<typeof DatePicker>>) {
	render(DatePicker, {
		props: {
			label: 'Pick a date',
			...props
		}
	});

	const button = screen.getByRole<HTMLButtonElement>('combobox', { name: /Pick a date/ });
	return { button };
}

describe('DatePicker', () => {
	it('renders a combobox button', () => {
		const { button } = renderDatePicker();
		expect(button).toBeInTheDocument();
	});

	it('shows the label text when no value is selected', () => {
		const { button } = renderDatePicker();
		expect(button).toHaveTextContent('Pick a date');
	});
});

describe('DatePicker — aria-invalid contract', () => {
	it('sets aria-invalid on the trigger button when ariaInvalid is true', () => {
		const { button } = renderDatePicker({ ariaInvalid: true });
		expect(button).toHaveAttribute('aria-invalid', 'true');
	});

	it('sets aria-invalid to false on the trigger button when ariaInvalid is false', () => {
		const { button } = renderDatePicker({ ariaInvalid: false });
		expect(button).toHaveAttribute('aria-invalid', 'false');
	});

	it('does not set aria-invalid on the trigger button when ariaInvalid is not passed', () => {
		const { button } = renderDatePicker();
		expect(button).not.toHaveAttribute('aria-invalid');
	});
});

describe('DatePicker — combobox wiring contract (#356)', () => {
	it('links the expanded trigger to the calendar popover via aria-controls', async () => {
		const { button } = renderDatePicker({ open: true });

		await vi.waitFor(() => {
			expect(button).toHaveAttribute('aria-controls');
		});
		const contentId = button.getAttribute('aria-controls')!;
		expect(document.getElementById(contentId)).not.toBeNull();
	});

	it('does not set aria-controls while collapsed', () => {
		const { button } = renderDatePicker();
		expect(button).not.toHaveAttribute('aria-controls');
	});
});
