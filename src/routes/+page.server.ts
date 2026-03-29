import { auth } from "$server/db";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = auth.withSession(
    async (session, _event) => {
        const userId = session.user.id;

        return { userId };
    },
);

export const actions = {} satisfies Actions;
