import { describe, expect, test } from 'vitest';
import type { schema } from '$lib/server/schema';
import {
	createUserCategory,
	deleteUserCategory,
	getUserCategories,
	getUserCategory
} from 'routes/category/category.utils';

const testCategory = 'Awesome Category';

let category: typeof schema.userCategory.$inferSelect;

describe('user categorys', () => {
	test('create user category', async () => {
		category = await createUserCategory('pjruqhtcfxxbaqu', testCategory);

		expect(category).toBeDefined();
		expect(category.name).toBe(testCategory);
	});

	test('get user categories', async () => {
		expect(await getUserCategories('pjruqhtcfxxbaqu')).toHaveLength(2);
		expect(await getUserCategory('pjruqhtcfxxbaqu', category.id)).toBeDefined();
	});

	test('delete user category', async () => {
		await deleteUserCategory('pjruqhtcfxxbaqu', category.id);
		expect(await getUserCategories('pjruqhtcfxxbaqu')).toHaveLength(1);
	});
});
