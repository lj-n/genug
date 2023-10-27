import { describe, expect, test } from 'vitest';
import { User } from '$lib/server/user';
import type { SelectUserCategory } from '$lib/server/schema/tables';

const testUserId = 'qh1jpx6731v8w7v';
const newCategoryName = 'Awesome Category';

const user = new User(testUserId);

describe('user categories', () => {
	let category: SelectUserCategory;

	test('create user category', () => {
		category = user.category.create({ name: newCategoryName });

		expect(category.name).toBe(newCategoryName);
		expect(category.retired).toBe(false);
		expect(category.userId).toBe(testUserId);
	});

	test('get user category', () => {
		category = user.category.get(category.id);
		expect(category.name).toBe(newCategoryName);
		expect(() => user.category.get(-1)).toThrowError();
	});

	test('update user category', () => {
		category = user.category.update(category.id, {
			...category,
			description: 'New Description'
		});

		expect(category.description).toBe('New Description');
	});

	test('delete user category', () => {
		const categoriesBefore = user.category.getAll();

		user.category.delete(category.id);

		const categoriesAfter = user.category.getAll();

		expect(categoriesBefore.length).toBeGreaterThan(categoriesAfter.length);
	});
});
