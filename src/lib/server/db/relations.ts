import { defineRelations } from "drizzle-orm";
import * as tables from "./tables";

export const relations = defineRelations(tables, (r) => ({
    sessions: {
        user: r.one.users({
            from: r.sessions.userId,
            to: r.users.id,
        }),
    },
}));
