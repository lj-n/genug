import { createId } from "../../utils/create-id";
import {
    check,
    foreignKey,
    primaryKey,
    sqliteTable,
} from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { categories } from "./categories";
import { sql } from "drizzle-orm";

export const budgets = sqliteTable(
    "budgets",
    (t) => (
        {
            id: t.text("id").primaryKey().$defaultFn(() => createId()),
            createdAt: t.integer("created_at", { mode: "timestamp" })
                .$defaultFn(() => new Date()).notNull(),
            name: t.text("name").notNull(),
        }
    ),
);

export const usersToBudgets = sqliteTable(
    "users_to_budgets",
    (t) => (
        {
            role: t.text("role", { enum: ["OWNER", "MEMBER", "INVITEE"] })
                .notNull(),
            userId: t.text("user_id")
                .references(() => users.id, { onDelete: "cascade" })
                .notNull(),
            budgetId: t.text("budget_id")
                .references(() => budgets.id, { onDelete: "cascade" })
                .notNull(),
        }
    ),
    (table) => [
        primaryKey({ columns: [table.userId, table.budgetId] }),
    ],
);

export const budgetAssignments = sqliteTable(
    "budget_assignments",
    (t) => ({
        budgetId: t.text("budget_id")
            .references(() => budgets.id, { onDelete: "cascade" })
            .notNull(),
        categoryId: t.text("category_id")
            .references(() => categories.id, { onDelete: "cascade" })
            .notNull(),
        amount: t.integer("amount").notNull(),
        month: t.integer("month")
            .notNull(),
    }),
    (t) => [
        primaryKey({ columns: [t.categoryId, t.month] }),
        foreignKey({
            columns: [t.categoryId, t.budgetId],
            foreignColumns: [categories.id, categories.budgetId],
        }),
        check(
            "date_format",
            sql`${t.month} between 190001 and 210012 AND ${t.month} % 100 between 1 and 12`,
        ),
    ],
);

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    const { createDatabase } = await import("../create-database");

    it("budgets - date format check constraint", async () => {
        const database = createDatabase(":memory:");

        const [budget] = await database
            .insert(budgets)
            .values({
                name: "Budget 1",
            })
            .returning();

        const [category] = await database
            .insert(categories)
            .values({
                name: "Category 1",
                budgetId: budget.id,
            })
            .returning();

        database.insert(budgetAssignments).values({
            budgetId: budget.id,
            categoryId: category.id,
            amount: 1000,
            month: 202312, // valid month
        });

        await expect(
            database.insert(budgetAssignments).values({
                budgetId: budget.id,
                categoryId: category.id,
                amount: 1000,
                month: 202313, // invalid month
            }),
        ).rejects.toThrow();
    });
}
