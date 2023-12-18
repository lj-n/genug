import { useTestDatabase } from "$testing/create.test.db";
import { beforeAll, describe, expect, test } from "vitest";
import type { Database } from "../db";
import { createUserCategory, deleteUserCategory, getUserCategories, getUserCategory, updateUserCategory } from "./category.user";

let db: Database;
let userId: string;

beforeAll(async () => {
	const { database, client, testUser } = useTestDatabase();
	db = database;
	userId = testUser.id;

	return async () => {
		client.close();
	};
});

describe('user categories', () => {
	let categoryId: number;

	test('create category', () => {
		const categoryName = 'Test Category';
		const categoryDescription = 'Text Category Description';
		const category = createUserCategory(db, {
			userId,
			name: categoryName,
			description: categoryDescription
		});

		categoryId = category.id;

		expect(category.name).toBe(categoryName);
		expect(category.userId).toBe(userId);
		expect(category.description).toBe(categoryDescription);
	});

	test('get category(s)', () => {
		const category = getUserCategory(db, userId, categoryId);
		const categorys = getUserCategories(db, userId);

		expect(category?.id).toBe(categoryId);
		expect(categorys).toHaveLength(1);
		expect(categorys).toContainEqual(category);

		expect(getUserCategory(db, userId, -1)).toBeUndefined();
	});

	test('update category', () => {
		const category = updateUserCategory(db, userId, categoryId, {
			name: 'New Name'
		});

		expect(category.name).toBe('New Name');
		expect(getUserCategory(db, userId, categoryId)?.name).toBe('New Name');

		expect(() =>
			updateUserCategory(db, userId, -1, { name: 'invalid id' })
		).toThrowError(`Category with id (-1) not found.`);
	});

	test('delete category', () => {
		const category = deleteUserCategory(db, userId, categoryId);

		expect(category?.id).toBe(categoryId);
		expect(getUserCategory(db, userId, categoryId)).toBeUndefined();
		expect(getUserCategories(db, userId)).toHaveLength(0);
	});
});