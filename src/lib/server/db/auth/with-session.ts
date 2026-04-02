import type { Session } from '$db/auth';
import type { ServerLoad, ServerLoadEvent } from '@sveltejs/kit';

import { database } from '$db';
import { Actions } from '$db/actions';
import { redirect } from '@sveltejs/kit';

/**
 * Wraps a server load function and ensures authentication.
 * Preserves nested layout's ParentData and infers PageData automatically.
 */
export function withSession<
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
	ParentData = Record<string, any>,
	Data = Record<string, any>
>(
	handler: (
		session: Session,
		actions: Actions,
		event: ServerLoadEvent<Params, ParentData>
	) => Data | Promise<Data>
): ServerLoad<Data, Params, ParentData> {
	return async (event: ServerLoadEvent<Params, ParentData>) => {
		// Access session from locals
		const session = event.locals.session as null | Session;

		if (!session) {
			const redirectTo = event.url.pathname + event.url.search;
			throw redirect(307, `/login?redirectTo=${redirectTo}`);
		}

		// Create Actions instance for this user
		const actions = new Actions({
			database,
			user: session.user
		});

		// Call the handler with typed session, actions, and event
		return handler(session, actions, event);
	};
}
