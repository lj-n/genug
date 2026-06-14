import type { Handle, HandleServerError } from '@sveltejs/kit';

import * as auth from '$db/auth';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { logger } from '$lib/server/logger';
import { createId } from '$server/utils/create-id';
import { sequence } from '@sveltejs/kit/hooks';

const handleLogging: Handle = async ({ event, resolve }) => {
	const requestId = createId();
	const start = performance.now();

	event.locals.logger = logger.child({ requestId });

	const response = await resolve(event);

	event.locals.logger.info({
		method: event.request.method,
		ms: Math.round(performance.now() - start),
		path: event.url.pathname,
		status: response.status
	});

	return response;
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = auth.getSessionCookie(event);

	if (!sessionToken) {
		event.locals.session = null;
		event.locals.user = null;
		return resolve(event);
	}

	const session = await auth.validateSession({ sessionToken });

	if (!session) {
		auth.deleteSessionCookie(event);
	} else {
		auth.setSessionCookie({
			cookies: event.cookies,
			expiresAt: session.expiresAt,
			sessionToken
		});
	}

	event.locals.session = session;
	event.locals.user = session?.user ?? null;

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

export const handle = sequence(handleLogging, handleAuth, handleParaglide);

export const handleError: HandleServerError = ({ error, event, status }) => {
	const logId = createId();
	const log = event.locals.logger ?? logger;

	if (status !== 404) {
		log.error({ err: error, logId, status }, 'unhandled server error');
	}

	return { logId, message: 'An unexpected error occurred.' };
};
