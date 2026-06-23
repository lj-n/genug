import type { ComponentProps } from 'svelte';

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

import SelectCategory from './select-category.svelte';

const categories = [
	{ id: 'c1', name: 'Groceries' },
	{ id: 'c2', name: 'Rent' },
	{ id: 'c3', name: 'Utilities' }
];

function renderSelectCategory(props?: Partial<ComponentProps<typeof SelectCategory>>) {
	render(SelectCategory, {
		props: {
			categories,
			...props
		}
	});

	const input = screen.getByRole<HTMLInputElement>('combobox');
	return { input };
}

describe('SelectCategory — single select', () => {
	it('renders a combobox input', () => {
		const { input } = renderSelectCategory();
		expect(input).toBeInTheDocument();
	});

	it('shows placeholder text', () => {
		const { input } = renderSelectCategory();
		expect(input.placeholder).toBe('No Category');
	});

	it('has a trigger button with caret icon', () => {
		renderSelectCategory();
		const trigger = document.querySelector('[data-combobox-trigger]');
		expect(trigger).toBeInTheDocument();
	});

	it('shows selected category name in the input', () => {
		const { input } = renderSelectCategory({ value: 'c2' });
		expect(input.value).toBe('Rent');
	});

	it('allows searching and selecting a category', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(SelectCategory, {
			props: { categories, name: 'categoryId' },
			target: form
		});

		const input = screen.getByRole('combobox');
		await user.click(input);
		await user.keyboard('Rent{Enter}');

		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('c2');
	});

	it('filters categories as user types', async () => {
		const user = userEvent.setup();
		renderSelectCategory();

		const input = screen.getByRole('combobox');
		await user.type(input, 'Ren');

		expect(screen.getByText('Rent')).toBeInTheDocument();
		expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
	});

	it('shows empty state placeholder when value is undefined', () => {
		const { input } = renderSelectCategory();
		expect(input.value).toBe('');
		expect(input.placeholder).toBe('No Category');
	});
});

describe('SelectCategory — nullable', () => {
	it('shows empty option when nullable', async () => {
		const user = userEvent.setup();
		renderSelectCategory({ nullable: true, value: 'c1' });

		const input = screen.getByRole('combobox');
		await user.click(input);
		await user.keyboard('{ArrowDown}');
		expect(screen.getByText('No Category')).toBeInTheDocument();
	});

	it('clears selection when empty option is chosen', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(SelectCategory, {
			props: { categories, name: 'categoryId', nullable: true, value: 'c1' },
			target: form
		});

		const input = screen.getByRole('combobox');
		await user.click(input);
		await user.keyboard('{ArrowDown}{Enter}');
		flushSync();

		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('');
	});
});

describe('SelectCategory — multi select', () => {
	it('submits selected values in FormData', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(SelectCategory, {
			props: { categories, multiple: true, name: 'categoryIds' },
			target: form
		});

		const input = screen.getByRole('combobox');
		await user.click(input);
		await user.keyboard('{ArrowDown}{Enter}{ArrowDown}{Enter}');
		flushSync();

		const formData = new FormData(form);
		expect(formData.getAll('categoryIds')).toEqual(['c1', 'c2']);
	});

	it('shows search placeholder when multi and empty', () => {
		const { input } = renderSelectCategory({ multiple: true });
		expect(input.placeholder).toBe('Search for category...');
	});

	it('shows selected count in input', () => {
		const { input } = renderSelectCategory({ multiple: true, value: ['c1', 'c3'] });
		expect(input.value).toBe('2 selected');
	});

	it('shows not-found text when search has no matches', async () => {
		const user = userEvent.setup();
		renderSelectCategory();

		const input = screen.getByRole('combobox');
		await user.type(input, 'zzz_nonexistent');

		expect(screen.getByText('No category found.')).toBeInTheDocument();
	});
});
