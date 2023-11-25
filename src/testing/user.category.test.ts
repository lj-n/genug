import { describe, expect, test } from 'vitest';
import { useUserCategory } from '$lib/server/user';

const testUserId = 'qh1jpx6731v8w7v';
const userCategories = useUserCategory(testUserId);

describe('user categories', () => {
	let categoryId: number;

	test('create category', () => {
		const name = 'Testcategory';
		const description = 'Testcategory description';

		const category = userCategories.create({ name, description });

		categoryId = category.id;

		expect(category.name).toBe(name);
		expect(category.description).toBe(description);
		expect(category.userId).toBe(testUserId);
	});

	test('get category', () => {
		const category = userCategories.get(categoryId);
		const categoryWithTransactions =
			userCategories.getWithTransactions(categoryId);
		const categorys = userCategories.getAll();
		const categorysWithTransactions = userCategories.getAllWithTransactions();

		expect(category).toBeDefined();
		expect(categoryWithTransactions).toHaveProperty('transactions', []);
		expect(categorys).toHaveLength(1);
		expect(categorysWithTransactions[0]).toHaveProperty('transactions', []);
	});

	test('update category', () => {
		const category = userCategories.update(categoryId, { name: 'New Name' });
		expect(category.name).toBe('New Name');
		expect(userCategories.get(categoryId)?.name).toBe('New Name');
	});

	test('remove category', () => {
		const removedcategory = userCategories.remove(categoryId);
		expect(removedcategory).toBeDefined();
		expect(userCategories.get(categoryId)).toBeUndefined();
	});
});
