import { sql } from "drizzle-orm";
import { index, sqliteTable, unique } from "drizzle-orm/sqlite-core";

import { createId } from "../../utils/create-id";
import { budgets } from "./budgets";

export const accounts = sqliteTable(
	"accounts",
	(t) => ({
		archived_at: t.integer("archived_at", { mode: "timestamp" }),
		budgetId: t
			.text("budget_id")
			.references(() => budgets.id, { onDelete: "cascade" })
			.notNull(),
		createdAt: t
			.integer("created_at", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.notNull(),
		id: t
			.text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: t.text("name").notNull(),
		notes: t.text("notes"),
	}),
	(t) => [
		index("account_active").on(t.budgetId)
			.where(sql`${t.archived_at} IS NULL`),
		unique("account_name_budget_unique").on(t.name, t.budgetId),
	],
);

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;
	const { createDatabase } = await import("../create-database");

	it("accounts - unique constraints", async () => {
		const database = createDatabase(":memory:");

		const [budget] = await database
			.insert(budgets)
			.values({
				id: "budget1",
				name: "Budget 1",
			})
			.returning();

		await database.insert(accounts).values({
			budgetId: budget.id,
			id: "account1",
			name: "Account 1",
		});

		await expect(
			database.insert(accounts).values({
				budgetId: budget.id,
				id: "account2",
				name: "Account 1", // same name
			}),
		).rejects.toThrow();
	});
}
