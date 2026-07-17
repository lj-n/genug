# Self-Hosting

Operational guidance for running your own genug-da instance. (This page is
being built out — see issue #123 for env vars, backups, and deploy guidance.)

## Port

The server listens on port **3000** by default. The container image sets
`ENV PORT=3000` and exposes the same port, so a plain port mapping works
without extra configuration:

```bash
docker run -p 3000:3000 ...
```

To serve on a different host port, change only the host side of the mapping
(`-p 8080:3000`). To make the server itself listen on a different port, set
the `PORT` env var and map that port instead:

```bash
docker run -e PORT=8080 -p 8080:8080 ...
```

An explicitly set `PORT` always beats the image default.

## ORIGIN

Set `ORIGIN` to the public URL your users reach the instance at, e.g.
`https://budget.example.com` (or `http://localhost:3000` for a local
container). SvelteKit uses it for CSRF protection: it compares each form
POST's `Origin` header against this value. Without it, logging in and every
other form submission fail with a "Cross-site POST form submissions are
forbidden" error (HTTP 403), even though GET pages render fine.

## Password recovery

There is no forgot-password flow and none is needed: recovery runs from the
server shell. The reset CLI is bundled into every build as
`build/reset-password.js` (ADR-0015), so it is available inside the deployed
container without a source checkout, email, or SMTP configuration.

Reset any user's password by username:

```bash
# Docker
docker exec <container> node build/reset-password.js <username>

# Bare metal (from the app root, with DATABASE_URL set)
node build/reset-password.js <username>
```

The command prints a fresh random password once and signs the user out of all
existing sessions — the printed password is then the only way into the
account. Log in with it and change it under Settings.

If the username does not match, the command lists the existing usernames and
exits non-zero.
