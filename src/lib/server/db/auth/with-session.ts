import { redirect } from "@sveltejs/kit";
import type { Session } from "$db/auth";

/**
 * Wraps a server load function and ensures that the user is authenticated.
 * If the user is not authenticated, they will be redirected to the login page.
 * If the user is authenticated, the session will be passed to the handler function.
 */
export function withSession<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends (event: any) => any,
>(
	handler: (
		session: Session,
		event: Parameters<T>[0],
	) => ReturnType<T>,
): T {
	return (async (event: Parameters<T>[0]) => {
		const session = event.locals.session;

		if (!session) {
			const redirectTo = event.url.pathname + event.url.search;
			throw redirect(
				307,
				`/login?redirectTo=${redirectTo}`,
			);
		}

		return handler(session, event);
	}) as T;
}
