import type { Handle } from '@sveltejs/kit';

import { database } from '$db';
import * as auth from '$db/auth';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { sequence } from '@sveltejs/kit/hooks';

const handleAuth: Handle = async ({ event, resolve }) => {
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
			expiresAt: session.expiresAt,
			sessionToken
		});
	}

	event.locals.session = session;

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale, request }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

export const handle = sequence(handleAuth, handleParaglide);
