import type { RequestEvent } from "@sveltejs/kit";

export const SESSION_COOKIE_NAME = "session_token" as const;

export function setSessionCookie(
    { event, sessionToken, expiresAt }: {
        event: RequestEvent;
        sessionToken: string;
        expiresAt?: Date;
    },
): void {
    event.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        path: "/",
        expires: expiresAt,
    });
}

export function deleteSessionCookie({ event }: { event: RequestEvent }): void {
    event.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
}
