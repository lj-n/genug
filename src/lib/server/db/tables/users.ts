import { createId } from "../../utils/create-id";
import { DAY_IN_MS } from "../../utils/day-in-ms";

import { sql } from "drizzle-orm";
import {
    primaryKey,
    sqliteTable,
    unique,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { budgets } from "./budgets";
import { accounts } from "./accounts";
import { categories } from "./categories";

export const sessions = sqliteTable(
    "sessions",
    (t) => (
        {
            id: t.text("id").primaryKey(),
            expiresAt: t.integer("expires_at", { mode: "timestamp" })
                .$defaultFn(() => new Date(Date.now() + DAY_IN_MS * 20))
                .notNull(),
            userId: t.text("user_id")
                .references(() => users.id, { onDelete: "cascade" })
                .notNull(),
        }
    ),
);

export const users = sqliteTable(
    "users",
    (t) => (
        {
            id: t.text("id").primaryKey().$defaultFn(() => createId()),
            createdAt: t.integer("created_at", { mode: "timestamp" })
                .$defaultFn(() => new Date()).notNull(),
            isAdmin: t.integer({ mode: "boolean" }).default(false).notNull(),
            passwordHash: t.text("password_hash").notNull(),
            username: t.text("username").notNull().unique(),
        }
    ),
    (t) => [
        uniqueIndex("admin_unique").on(t.isAdmin).where(sql`${t.isAdmin} = 1`),
        unique("username_unique").on(t.username),
    ],
);

export const userBudgetOrder = sqliteTable(
    "user_budget_order",
    (t) => (
        {
            userId: t.text("user_id")
                .references(() => users.id, { onDelete: "cascade" })
                .notNull(),
            budgetId: t.text("budget_id")
                .references(() => budgets.id, { onDelete: "cascade" })
                .notNull(),
            position: t.integer("position").notNull(),
        }
    ),
    (table) => [
        primaryKey({ columns: [table.userId, table.budgetId] }),
    ],
);

export const userAccountOrder = sqliteTable(
    "user_account_order",
    (t) => (
        {
            userId: t.text("user_id")
                .references(() => users.id, { onDelete: "cascade" })
                .notNull(),
            accountId: t.text("account_id")
                .references(() => accounts.id, { onDelete: "cascade" })
                .notNull(),
            position: t.integer("position").notNull(),
        }
    ),
    (table) => [
        primaryKey({ columns: [table.userId, table.accountId] }),
    ],
);

export const userCategoryOrder = sqliteTable(
    "user_category_order",
    (t) => (
        {
            userId: t.text("user_id")
                .references(() => users.id, { onDelete: "cascade" })
                .notNull(),
            categoryId: t.text("category_id")
                .references(() => categories.id, { onDelete: "cascade" })
                .notNull(),
            position: t.integer("position").notNull(),
        }
    ),
    (table) => [
        primaryKey({ columns: [table.userId, table.categoryId] }),
    ],
);

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    const { createDatabase } = await import("../create-database");

    it("users - unique constraints", async () => {
        const database = createDatabase(":memory:");

        await database.insert(users).values({
            username: "user1",
            passwordHash: "hash1",
        });

        await expect(
            database.insert(users).values({
                username: "user1", // same username
                passwordHash: "hash2",
            }),
        ).rejects.toThrow();
    });
}
