import { describe, expect, test } from 'vitest';
import {
	createUserCategory,
	deleteUserCategory,
	getUserCategories,
	getUserCategory,
	updateUserCategory
} from '$lib/server/categories';
import type { UserCategory } from '$lib/server/schema/tables';

const testUserId = 'pjruqhtcfxxbaqu';
const newCategoryName = 'Awesome Category';

describe('user categories', () => {
	let category: UserCategory;

	test('create user category', () => {
		category = createUserCategory(testUserId, newCategoryName);

		expect(category.name).toBe(newCategoryName);
		expect(category.retired).toBe(false);
		expect(category.userId).toBe(testUserId);
	});

	test('create invalid user category', () => {
		expect(() => createUserCategory('123', 'Name')).toThrowError();
	});

	test('get user account', () => {
		category = getUserCategory(testUserId, category.id);
		expect(category.name).toBe(newCategoryName);
		expect(() => getUserCategory(testUserId, -1)).toThrowError();
	});

	test('update user category', () => {
		category = updateUserCategory(category.id, {
			...category,
			description: 'New Description'
		});

		expect(category.description).toBe('New Description');
	});

	test('delete user category', () => {
		const categoriesBefore = getUserCategories(testUserId);

		deleteUserCategory(testUserId, category.id);

		const categoriesAfter = getUserCategories(testUserId);

		expect(categoriesBefore.length).toBeGreaterThan(categoriesAfter.length);
	});
});
