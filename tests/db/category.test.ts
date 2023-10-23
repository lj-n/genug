import { describe, expect, test } from 'vitest';
import type { schema } from '$lib/server/schema';
import {
	createUserCategory,
	deleteUserCategory,
	getUserCategories,
	getUserCategory
} from '$lib/server/categories';

const testCategory = 'Awesome Category';

let category: typeof schema.userCategory.$inferSelect;

describe('user categorys', () => {
	test('create user category', () => {
		category = createUserCategory('pjruqhtcfxxbaqu', testCategory);

		expect(category).toBeDefined();
		expect(category.name).toBe(testCategory);
	});

	test('get user categories', () => {
		expect(getUserCategories('pjruqhtcfxxbaqu')).toHaveLength(2);
		expect(getUserCategory('pjruqhtcfxxbaqu', category.id)).toBeDefined();
	});

	test('delete user category', () => {
		deleteUserCategory('pjruqhtcfxxbaqu', category.id);
		expect(getUserCategories('pjruqhtcfxxbaqu')).toHaveLength(1);
	});
});
