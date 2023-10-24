import { describe, expect, test } from 'vitest';
import { User } from '$lib/server/user';
import type { UserCategory } from '$lib/server/schema/tables';

const testUserId = 'pjruqhtcfxxbaqu';
const newCategoryName = 'Awesome Category';

const user = new User(testUserId);

describe('user categories', () => {
	let category: UserCategory;

	test('create user category', () => {
		category = user.categories.create({ name: newCategoryName });

		expect(category.name).toBe(newCategoryName);
		expect(category.retired).toBe(false);
		expect(category.userId).toBe(testUserId);
	});

	test('get user category', () => {
		category = user.categories.get(category.id);
		expect(category.name).toBe(newCategoryName);
		expect(() => user.categories.get(-1)).toThrowError();
	});

	test('update user category', () => {
		category = user.categories.update(category.id, {
			...category,
			description: 'New Description'
		});

		expect(category.description).toBe('New Description');
	});

	test('delete user category', () => {
		const categoriesBefore = user.categories.getAll();

		user.categories.delete(category.id);

		const categoriesAfter = user.categories.getAll();

		expect(categoriesBefore.length).toBeGreaterThan(categoriesAfter.length);
	});
});
