import { sql } from "drizzle-orm";
import {
	index,
	primaryKey,
	sqliteTable,
	unique,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { createId } from "../../utils/create-id";
import { DAY_IN_MS } from "../../utils/day-in-ms";
import { accounts } from "./accounts";
import { budgets } from "./budgets";
import { categories } from "./categories";

export const sessions = sqliteTable(
	"sessions",
	(t) => ({
		expiresAt: t
			.integer("expires_at", { mode: "timestamp" })
			.$defaultFn(() => new Date(Date.now() + DAY_IN_MS * 20))
			.notNull(),
		id: t.text("id").primaryKey(),
		userId: t
			.text("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
	}),
	(t) => [
		index("session_user").on(t.userId),
	],
);

export const users = sqliteTable(
	"users",
	(t) => ({
		createdAt: t
			.integer("created_at", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.notNull(),
		id: t
			.text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		isAdmin: t.integer({ mode: "boolean" }).default(false).notNull(),
		passwordHash: t.text("password_hash").notNull(),
		username: t.text("username").notNull().unique(),
	}),
	(t) => [
		uniqueIndex("admin_unique")
			.on(t.isAdmin)
			.where(sql`${t.isAdmin} = 1`),
		unique("username_unique").on(t.username),
	],
);

export const userBudgetOrder = sqliteTable(
	"user_budget_order",
	(t) => ({
		budgetId: t
			.text("budget_id")
			.references(() => budgets.id, { onDelete: "cascade" })
			.notNull(),
		position: t.integer("position").notNull(),
		userId: t
			.text("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
	}),
	(t) => [primaryKey({ columns: [t.userId, t.budgetId] })],
);

export const userAccountOrder = sqliteTable(
	"user_account_order",
	(t) => ({
		accountId: t
			.text("account_id")
			.references(() => accounts.id, { onDelete: "cascade" })
			.notNull(),
		position: t.integer("position").notNull(),
		userId: t
			.text("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
	}),
	(t) => [primaryKey({ columns: [t.userId, t.accountId] })],
);

export const userCategoryOrder = sqliteTable(
	"user_category_order",
	(t) => ({
		categoryId: t
			.text("category_id")
			.references(() => categories.id, { onDelete: "cascade" })
			.notNull(),
		position: t.integer("position").notNull(),
		userId: t
			.text("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
	}),
	(t) => [primaryKey({ columns: [t.userId, t.categoryId] })],
);

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;
	const { createDatabase } = await import("../create-database");

	it("users - unique constraints", async () => {
		const database = createDatabase(":memory:");

		await database.insert(users).values({
			passwordHash: "hash1",
			username: "user1",
		});

		await expect(
			database.insert(users).values({
				passwordHash: "hash2",
				username: "user1", // same username
			}),
		).rejects.toThrow();
	});
}
