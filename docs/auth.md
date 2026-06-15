# Auth

Custom session-based authentication — no Auth.js. Implemented in `src/lib/server/db/auth/`.

## Stack

- Password hashing: `@node-rs/argon2`
- Crypto primitives: `@oslojs/crypto`
- Session tokens: random bytes encoded as hex (via `create-session-token.ts`)

## Flow

**Login:**

1. `authenticateUser({ database, username, password })` — looks up user, verifies password with `verifyPassword()`. Returns `Result<User, AuthFailure>`.
2. `createSessionToken()` — generates a random token.
3. `createSession({ database, sessionToken, userId })` — hashes the token, stores in `sessions` table, returns `{ expiresAt }` (20-day TTL).
4. `setSessionCookie({ event, sessionToken, expiresAt })` — sets an httpOnly cookie.

**Per-request validation (in `handleAuth` hook):**

1. Read `SESSION_COOKIE_NAME` cookie.
2. `validateSession({ database, sessionToken })` — hashes the token, looks up the session, checks expiry. Returns `Session | null`.
3. On valid session: `setSessionCookie()` to refresh the cookie. Sets `event.locals.session`.
4. On invalid/missing: `deleteSessionCookie()`, sets `event.locals.session = null`.

**Logout:**

1. `deleteSession({ database, sessionId })` — removes from DB.
2. `deleteSessionCookie({ event })` — clears cookie.
3. Redirect to `/login`.

## Key files

| File                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `authenticate-user.ts`    | Username + password check, returns `Result<User, AuthFailure>` |
| `verify-password.ts`      | Argon2 verify wrapper                                          |
| `hash-password.ts`        | Argon2 hash wrapper                                            |
| `create-session-token.ts` | Generates random session token                                 |
| `create-session.ts`       | Stores hashed token in DB                                      |
| `validate-session.ts`     | Validates token on each request                                |
| `refresh-session.ts`      | Updates session expiry                                         |
| `cookie-session.ts`       | `set/delete/SESSION_COOKIE_NAME` helpers                       |
| `delete-session.ts`       | Removes session from DB                                        |
| `types.ts`                | `Session`, `User`, `AuthFailure` types                         |

## Result type

`src/lib/server/utils/result.ts` — generic `Result<T, E>` with `ok(data)` and `err(error)` constructors. Used in `authenticateUser` to distinguish auth failures from thrown errors.
