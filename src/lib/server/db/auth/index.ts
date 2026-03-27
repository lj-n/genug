import type { tables } from "$db";

/**
 * This type represents the session object that is attached to the locals of the event in the `handle` hook.
 */
export type Session = Omit<typeof tables.sessions.$inferSelect, "userId"> & {
    user: Omit<typeof tables.users.$inferSelect, "passwordHash">;
};

export { createSessionToken } from "./create-session-token";
export { validateSession } from "./validate-session";
export { createSession } from "./create-session";
export { deleteSession } from "./delete-session";
export { hashPassword } from "./hash-password";
export { verifyPassword } from "./verify-password";
export { refreshSession } from "./refresh-session";
export { withSession } from "./with-session";
export { authenticateUser } from "./authenticate-user";

export * from "./cookie-session";
export * from "./types";
