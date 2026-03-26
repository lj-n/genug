import { createId } from "../utils/create-id";
import { DAY_IN_MS } from "../utils/day-in-ms";

import { sql } from "drizzle-orm";
import {
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
    "users",
    {
        createdAt: integer("created_at", { mode: "timestamp" })
            .$defaultFn(() => new Date()).notNull(),
        id: text("id").primaryKey().$defaultFn(() => createId()),
        isAdmin: integer({ mode: "boolean" }).default(false).notNull(),
        passwordHash: text("password_hash").notNull(),
        username: text("username").notNull().unique(),
    },
    (table) => [
        uniqueIndex("admin_unique")
            .on(table.isAdmin)
            .where(sql`${table.isAdmin} = 1`),
        uniqueIndex("username_unique").on(table.username),
    ],
);

export const sessions = sqliteTable("sessions", {
    expiresAt: integer("expires_at", { mode: "timestamp" })
        .$defaultFn(() => new Date(Date.now() + DAY_IN_MS * 20)).notNull(),
    id: text("id").primaryKey(),
    userId: text("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
});
