# 15. Recovery CLI is bundled into the server image

Date: 2026-07-16

## Status

Accepted

## Context

A sole admin who forgets their password is locked out of their own finances:
there is no forgot-password flow, and adding one would drag in email/SMTP
configuration that self-hosted deployments should not need (#128, #132). The
supported recovery path is a command run from the server shell.

The primary deployment is the ghcr Docker image. Its final stage contains only
`build/`, pruned production `node_modules`, the migrations, and `package.json`
— no `src/`, no `scripts/`, no devDependencies. A tsx-based script in the
seed.ts style therefore cannot run inside the deployed container; it would
only work from a source checkout pointed at the volume-mounted SQLite file.

## Decision

The password-reset CLI (`scripts/reset-password.ts`) is bundled at build time
into `build/reset-password.js` with esbuild, chained after `vite build` in the
`build` npm script. Path aliases are resolved at bundle time; the native
modules (`better-sqlite3`, `@node-rs/argon2`) remain external because they are
production dependencies present in the image. Since the Dockerfile copies
`build/` wholesale and `DATABASE_URL` is part of the container environment,
recovery works out of the box on any deployment:

    docker exec <container> node build/reset-password.js <username>

The CLI is a thin adapter. The reset semantics — generate a policy-conforming
random password, hash with the existing auth hashing, replace the hash, delete
all of the user's sessions, return the plaintext — live in
`resetPassword({ db, username })` in the auth module, where they are
unit-tested.

## Consequences

- Recovery requires no repo checkout, no email/SMTP, and no Dockerfile change.
- `npm run build` gains a second step; the CLI bundle is produced by every
  build (dev, CI, Docker) and versions in lockstep with the server it sits
  beside.
- esbuild becomes an explicit devDependency.
- The bundle imports the real auth module, so hashing or schema changes flow
  into the CLI automatically at the next build; there is no drift between the
  app's password logic and the recovery path.
- Rejected alternatives: tsx-from-checkout (fails the "works on any
  deployment out of the box" criterion for Docker users) and an alias-free
  raw-SQL script copied into the image (bypasses the Drizzle auth seam,
  duplicating reset semantics outside the tested module).
