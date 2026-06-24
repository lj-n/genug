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

describe('SelectCategory', () => {
	it('renders a combobox input', () => {
		const { input } = renderSelectCategory();
		expect(input).toBeInTheDocument();
	});

	it('shows placeholder text', () => {
		const { input } = renderSelectCategory();
		expect(input.placeholder).toBe('Search for category...');
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

		const input = screen.getByRole<HTMLInputElement>('combobox');
		await user.click(input);
		await user.keyboard('Rent{Enter}');

		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('c2');
	});

	it('filters categories as user types', async () => {
		const user = userEvent.setup();
		renderSelectCategory();

		const input = screen.getByRole<HTMLInputElement>('combobox');
		await user.type(input, 'Ren');

		expect(screen.getByText('Rent')).toBeInTheDocument();
		expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
	});

	it('shows empty input when value is empty string without nullable', () => {
		const { input } = renderSelectCategory({ value: '' });
		expect(input.value).toBe('');
	});
});

describe('SelectCategory — nullable', () => {
	it("shows 'No Category' in input when value is empty and nullable", () => {
		const { input } = renderSelectCategory({ nullable: true, value: '' });
		expect(input.value).toBe('No Category');
	});

	it('shows empty option when nullable', async () => {
		const user = userEvent.setup();
		renderSelectCategory({ nullable: true, value: 'c1' });

		const input = screen.getByRole<HTMLInputElement>('combobox');
		await user.click(input);
		await user.keyboard('{ArrowDown}');
		expect(screen.getByText('No Category')).toBeInTheDocument();
	});

	it('switches display from category to No Category when selected', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		const { component } = render(SelectCategory, {
			props: { categories, name: 'categoryId', nullable: true, value: 'c1' },
			target: form
		});

		const input = screen.getByRole<HTMLInputElement>('combobox');
		expect(input.value).toBe('Groceries');

		await user.click(input);
		await user.keyboard('{ArrowDown}{Enter}');
		flushSync();

		expect(input.value).toBe('No Category');
		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('');
	});

	it('sets value to empty string when empty option is chosen', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(SelectCategory, {
			props: { categories, name: 'categoryId', nullable: true, value: 'c1' },
			target: form
		});

		const input = screen.getByRole<HTMLInputElement>('combobox');
		await user.click(input);
		await user.keyboard('{ArrowDown}{Enter}');
		flushSync();

		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('');
	});

	it('does not show empty option when nullable is false', async () => {
		const user = userEvent.setup();
		renderSelectCategory({ nullable: false });

		const input = screen.getByRole<HTMLInputElement>('combobox');
		await user.click(input);

		expect(screen.queryByText('No Category')).not.toBeInTheDocument();
	});

	it('shows not-found text when search has no matches and not nullable', async () => {
		const user = userEvent.setup();
		renderSelectCategory();

		const input = screen.getByRole<HTMLInputElement>('combobox');
		await user.type(input, 'zzz_nonexistent');

		expect(screen.getByText('No category found.')).toBeInTheDocument();
	});
});

describe('SelectCategory — deselection', () => {
	it('keeps selected category when pressing Enter on it again', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(SelectCategory, {
			props: { categories, name: 'categoryId', value: 'c2' },
			target: form
		});

		const input = screen.getByRole<HTMLInputElement>('combobox');
		expect(input.value).toBe('Rent');

		// Open dropdown, press Enter on the already-selected item
		await user.click(input);
		await user.keyboard('{Enter}');
		flushSync();

		expect(input.value).toBe('Rent');
		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('c2');
	});

	it('deselects to empty string when clicking category again with nullable', async () => {
		const user = userEvent.setup();
		const form = document.createElement('form');
		document.body.append(form);

		render(SelectCategory, {
			props: { categories, name: 'categoryId', nullable: true, value: 'c2' },
			target: form
		});

		const input = screen.getByRole<HTMLInputElement>('combobox');
		expect(input.value).toBe('Rent');

		await user.click(input);
		await user.keyboard('{Enter}');
		flushSync();

		// Re-clicking same item: stay on Rent, don't jump to No Category
		expect(input.value).toBe('Rent');
		const formData = new FormData(form);
		expect(formData.get('categoryId')).toBe('c2');
	});
});
