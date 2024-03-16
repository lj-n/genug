import type { Database } from '$lib/server/db';
import { schema } from '$lib/server/schema';

function transaction(
	db: Database,
	insert: Omit<typeof schema.transaction.$inferInsert, 'validated'>
) {
	return db
		.insert(schema.transaction)
		.values({ validated: true, ...insert })
		.returning()
		.get();
}

const currentDate = new Date();
const previousMonth = new Date(currentDate);
previousMonth.setMonth(currentDate.getMonth() - 1);
const nextMonth = new Date(currentDate);
nextMonth.setMonth(currentDate.getMonth() + 1);

export function createDummyData(db: Database, userId: string) {
	const [category1, category2, account1, account2] = [
		db
			.insert(schema.category)
			.values({ name: 'Category 1', userId })
			.returning()
			.get(),
		db
			.insert(schema.category)
			.values({ name: 'Category 2', userId })
			.returning()
			.get(),
		db
			.insert(schema.account)
			.values({ name: 'Account 1', userId })
			.returning()
			.get(),
		db
			.insert(schema.account)
			.values({ name: 'Account 2', userId })
			.returning()
			.get()
	] as const;

	/** Create Transactions */
	{
		/**
		 * First category, first account
		 */
		transaction(db, {
			userId,
			categoryId: category1.id,
			accountId: account1.id,
			flow: 1800,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: category1.id,
			accountId: account1.id,
			flow: -600,
			date: previousMonth.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: category1.id,
			accountId: account1.id,
			flow: 200,
			date: currentDate.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: category1.id,
			accountId: account1.id,
			flow: -600,
			date: currentDate.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: category1.id,
			accountId: account1.id,
			flow: 100,
			date: nextMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: category1.id,
			accountId: account1.id,
			flow: -900,
			date: nextMonth.toISOString()
		});
	}

	{
		/**
		 * Second category, second account
		 */
		transaction(db, {
			userId,
			categoryId: category2.id,
			accountId: account2.id,
			flow: 200,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: category2.id,
			accountId: account2.id,
			flow: -2500,
			date: previousMonth.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: category2.id,
			accountId: account2.id,
			flow: 300,
			date: currentDate.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: category2.id,
			accountId: account2.id,
			flow: -4000,
			date: currentDate.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: category2.id,
			accountId: account2.id,
			flow: 700,
			date: nextMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: category2.id,
			accountId: account2.id,
			flow: -1000,
			date: nextMonth.toISOString()
		});
	}

	{
		/**
		 * No category, second account
		 */
		transaction(db, {
			userId,
			accountId: account2.id,
			flow: 2000,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			accountId: account2.id,
			flow: -600,
			date: previousMonth.toISOString()
		});

		transaction(db, {
			userId,
			accountId: account2.id,
			flow: 800,
			date: currentDate.toISOString()
		});
		transaction(db, {
			userId,
			accountId: account2.id,
			flow: -600,
			date: currentDate.toISOString()
		});

		transaction(db, {
			userId,
			accountId: account2.id,
			flow: 800,
			date: nextMonth.toISOString()
		});
		transaction(db, {
			userId,
			accountId: account2.id,
			flow: -600,
			date: nextMonth.toISOString()
		});
	}

	return [category1, category2, account1, account2] as const;
}

export function createDummyDataWithTeams(
	db: Database,
	userId: string,
	userId2: string
) {
	const [category1, category2] = createDummyData(db, userId);

	const [team1, team2, team3] = [
		db.insert(schema.team).values({ name: 'Team 1' }).returning().get(),
		db.insert(schema.team).values({ name: 'Team 2' }).returning().get(),
		db.insert(schema.team).values({ name: 'Team 3' }).returning().get()
	] as const;

	db.insert(schema.teamMember)
		.values({ userId, teamId: team1.id, role: 'OWNER' })
		.returning()
		.get();
	db.insert(schema.teamMember)
		.values({ userId, teamId: team2.id, role: 'MEMBER' })
		.returning()
		.get();
	db.insert(schema.teamMember)
		.values({ userId, teamId: team3.id, role: 'INVITED' })
		.returning()
		.get();

	const teamCategory1 = db
		.insert(schema.category)
		.values({ name: 'Team Category 1', teamId: team1.id, userId })
		.returning()
		.get();
	const teamCategory2 = db
		.insert(schema.category)
		.values({ name: 'Team Category 2', teamId: team2.id, userId })
		.returning()
		.get();

	const teamAccount1 = db
		.insert(schema.account)
		.values({ name: 'Team Account 1', teamId: team1.id, userId })
		.returning()
		.get();
	const teamAccount2 = db
		.insert(schema.account)
		.values({ name: 'Team Account 2', teamId: team2.id, userId })
		.returning()
		.get();

	/** Create a category and account which User1 should not see/receive a budget for. */
	const teamCategory3 = db
		.insert(schema.category)
		.values({
			name: 'Team Category 3',
			teamId: team3.id,
			userId: userId2
		})
		.returning()
		.get();
	const teamAccount3 = db
		.insert(schema.account)
		.values({
			name: 'Team Account 3',
			teamId: team3.id,
			userId: userId2
		})
		.returning()
		.get();

	/** Create Transactions */
	{
		/**
		 * First category, first account
		 */
		transaction(db, {
			userId,
			categoryId: teamCategory1.id,
			accountId: teamAccount1.id,
			flow: 200,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: teamCategory1.id,
			accountId: teamAccount1.id,
			flow: -2000,
			date: previousMonth.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: teamCategory1.id,
			accountId: teamAccount1.id,
			flow: 800,
			date: currentDate.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: teamCategory1.id,
			accountId: teamAccount1.id,
			flow: -1200,
			date: currentDate.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: teamCategory1.id,
			accountId: teamAccount1.id,
			flow: 100,
			date: nextMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: teamCategory1.id,
			accountId: teamAccount1.id,
			flow: -200,
			date: nextMonth.toISOString()
		});
	}

	{
		/**
		 * Second category, second account
		 */
		transaction(db, {
			userId,
			categoryId: teamCategory2.id,
			accountId: teamAccount2.id,
			flow: 200,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: teamCategory2.id,
			accountId: teamAccount2.id,
			flow: -1500,
			date: previousMonth.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: teamCategory2.id,
			accountId: teamAccount2.id,
			flow: 300,
			date: currentDate.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: teamCategory2.id,
			accountId: teamAccount2.id,
			flow: -2400,
			date: currentDate.toISOString()
		});

		transaction(db, {
			userId,
			categoryId: teamCategory2.id,
			accountId: teamAccount2.id,
			flow: 700,
			date: nextMonth.toISOString()
		});
		transaction(db, {
			userId,
			categoryId: teamCategory2.id,
			accountId: teamAccount2.id,
			flow: -700,
			date: nextMonth.toISOString()
		});
	}

	{
		/**
		 * No category, second account
		 */
		transaction(db, {
			userId,
			accountId: teamAccount2.id,
			flow: 2000,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			accountId: teamAccount2.id,
			flow: -600,
			date: previousMonth.toISOString()
		});

		transaction(db, {
			userId,
			accountId: teamAccount2.id,
			flow: 800,
			date: currentDate.toISOString()
		});
		transaction(db, {
			userId,
			accountId: teamAccount2.id,
			flow: -200,
			date: currentDate.toISOString()
		});

		transaction(db, {
			userId,
			accountId: teamAccount2.id,
			flow: 4800,
			date: nextMonth.toISOString()
		});
		transaction(db, {
			userId,
			accountId: teamAccount2.id,
			flow: -50,
			date: nextMonth.toISOString()
		});
	}

	{
		/**
		 * No category, first account
		 */
		transaction(db, {
			userId,
			accountId: teamAccount1.id,
			flow: 2000,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId,
			accountId: teamAccount1.id,
			flow: -100,
			date: previousMonth.toISOString()
		});
	}

	{
		/**
		 * Create Transaction the user should not see
		 */
		transaction(db, {
			userId: userId2,
			categoryId: teamCategory3.id,
			accountId: teamAccount3.id,
			flow: -2000,
			date: previousMonth.toISOString()
		});
		transaction(db, {
			userId: userId2,
			accountId: teamAccount3.id,
			flow: 15000,
			date: previousMonth.toISOString()
		});
	}

	return {
		category1,
		category2,
		team1,
		team2,
		teamCategory1,
		teamCategory2,
		teamCategory3,
		teamAccount1,
		teamAccount2
	} as const;
}
