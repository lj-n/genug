import { beforeAll, describe, expect, test } from 'vitest';
import { createTeam, removeTeam, useTeamCategory } from '$lib/server/team';

const testUserId = 'qh1jpx6731v8w7v';

let teamId: number;

beforeAll(() => {
	const team = createTeam({ userId: testUserId, teamname: 'Test Team' });
	teamId = team.id;

	return () => {
		removeTeam(teamId);
	};
});

describe('user categories', () => {
	let categoryId: number;

	test('create category', () => {
		const teamCategory = useTeamCategory(teamId);
		const name = 'Testcategory';
		const description = 'Testcategory description';

		const category = teamCategory.create({
			name,
			description,
			createdBy: testUserId
		});

		categoryId = category.id;

		expect(category.name).toBe(name);
		expect(category.description).toBe(description);
		expect(category.teamId).toBe(teamId);
		expect(category.createdBy).toBe(testUserId);
	});

	test('get category', () => {
		const teamCategory = useTeamCategory(teamId);

		const category = teamCategory.get(categoryId);
		const categoryWithTransactions =
			teamCategory.getWithTransactions(categoryId);
		const categorys = teamCategory.getAll();
		const categorysWithTransactions = teamCategory.getAllWithTransactions();

		expect(category).toBeDefined();
		expect(categoryWithTransactions).toHaveProperty('transactions', []);
		expect(categorys).toHaveLength(1);
		expect(categorysWithTransactions[0]).toHaveProperty('transactions', []);
	});

	test('update category', () => {
		const teamCategory = useTeamCategory(teamId);
		const category = teamCategory.update(categoryId, { name: 'New Name' });
		expect(category.name).toBe('New Name');
		expect(teamCategory.get(categoryId).name).toBe('New Name');
	});

	test('remove category', () => {
		const teamCategory = useTeamCategory(teamId);
		const removedcategory = teamCategory.remove(categoryId);
		expect(removedcategory).toBeDefined();
		expect(() => teamCategory.get(categoryId)).toThrowError(
			`Team(${teamId}) category(${categoryId}) not found`
		);
	});
});
