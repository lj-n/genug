import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { InsertTeamCategory, SelectTeamCategory } from '../schema/tables';

const teamCategoryFindFirst = db.query.teamCategory
	.findFirst({
		where: (category, { and, eq, sql }) => {
			return and(
				eq(category.id, sql.placeholder('categoryId')),
				eq(category.teamId, sql.placeholder('teamId'))
			);
		}
	})
	.prepare();

const teamCategoryFindMany = db.query.teamCategory
	.findMany({
		where: (category, { eq, sql }) => {
			return eq(category.teamId, sql.placeholder('teamId'));
		}
	})
	.prepare();

const teamCategoryWithTransactionsFindFirst = db.query.teamCategory
	.findFirst({
		where: (category, { and, eq, sql }) => {
			return and(
				eq(category.id, sql.placeholder('categoryId')),
				eq(category.teamId, sql.placeholder('teamId'))
			);
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const teamCategoryWithTransactionsFindMany = db.query.teamCategory
	.findMany({
		where: (category, { eq, sql }) => {
			return eq(category.teamId, sql.placeholder('teamId'));
		},
		with: {
			transactions: true
		}
	})
	.prepare();

export function useTeamCategory(teamId: number) {
	function create(
		draft: Pick<
			InsertTeamCategory,
			'name' | 'description' | 'createdBy' | 'goal'
		>
	): SelectTeamCategory {
		const createdCategory = db
			.insert(schema.teamCategory)
			.values({ teamId, ...draft })
			.returning()
			.get();

		if (!createdCategory) {
			throw new Error(`Could not create team(${teamId}) category.`);
		}

		return createdCategory;
	}

	function get(categoryId: number) {
		const category = teamCategoryFindFirst.get({ categoryId, teamId });

		if (!category) {
			throw new Error(`Team(${teamId}) category(${categoryId}) not found`);
		}

		return category;
	}

	function getWithTransactions(categoryId: number) {
		const category = teamCategoryWithTransactionsFindFirst.get({
			categoryId,
			teamId
		});

		if (!category) {
			throw new Error(`Team(${teamId}) category(${categoryId}) not found`);
		}

		return category;
	}

	function getAll() {
		return teamCategoryFindMany.all({ teamId });
	}

	function getAllWithTransactions() {
		return teamCategoryWithTransactionsFindMany.all({ teamId });
	}

	function update(
		categoryId: number,
		updates: Pick<
			InsertTeamCategory,
			'name' | 'description' | 'goal' | 'retired'
		>
	): SelectTeamCategory {
		const updatedCategory = db
			.update(schema.teamCategory)
			.set(updates)
			.where(
				and(
					eq(schema.teamCategory.id, categoryId),
					eq(schema.teamCategory.teamId, teamId)
				)
			)
			.returning()
			.get();

		if (!updatedCategory) {
			throw new Error(
				`Could not update team(${teamId}) category(${categoryId}).`
			);
		}

		return updatedCategory;
	}

	function remove(categoryId: number): SelectTeamCategory {
		const removedCategory = db
			.delete(schema.teamCategory)
			.where(
				and(
					eq(schema.teamCategory.teamId, teamId),
					eq(schema.teamCategory.id, categoryId)
				)
			)
			.returning()
			.get();

		if (!removedCategory) {
			throw new Error(
				`Could not remove team(${teamId}) category(${categoryId}).`
			);
		}

		return removedCategory;
	}

	return {
		create,
		get,
		getWithTransactions,
		getAll,
		getAllWithTransactions,
		update,
		remove
	};
}
