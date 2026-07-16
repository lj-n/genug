# Self-Hosting

Operational guidance for running your own genug-da instance. (This page is
being built out — see issue #123 for env vars, backups, and deploy guidance.)

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
