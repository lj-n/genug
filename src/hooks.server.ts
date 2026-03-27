import type { Handle } from "@sveltejs/kit";
import * as auth from "$db/auth";
import { database } from "$db";

export const handle: Handle = async ({ event, resolve }) => {
    const sessionToken = event.cookies.get(auth.SESSION_COOKIE_NAME);

    if (!sessionToken) {
        event.locals.session = null;
        return resolve(event);
    }

    const session = await auth.validateSession({ database, sessionToken });

    if (!session) {
        auth.deleteSessionCookie({ event });
    } else {
        auth.setSessionCookie({
            event,
            sessionToken,
            expiresAt: session.expiresAt,
        });
    }

    event.locals.session = session;

    return resolve(event);
};
