import type { tables } from "$db";

export type Session = Omit<typeof tables.sessions.$inferSelect, "userId"> & {
    user: Omit<typeof tables.users.$inferSelect, "passwordHash">;
};
