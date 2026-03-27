import { withSession } from "$server/db/auth";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = withSession(
    async (session, _event) => ({ session }),
);
