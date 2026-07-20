# Self-Hosting

Operational guidance for running your own genug-da instance. For what the
app does and how to use it, see [usage.md](usage.md).

genug-da is a single Node.js process backed by a single SQLite database
file. There are no external services: no mail server, no cache, no separate
database server.

## Prerequisites

- **Docker** for the container images below, or
- **Node.js 22+** plus build tools for native addons (better-sqlite3
  compiles from source) for a manual install.

## Container images

Prebuilt images are published to the GitHub Container Registry at
`ghcr.io/lj-n/genug-da`:

| Tag           | Built from      | Use                                                                         |
| ------------- | --------------- | --------------------------------------------------------------------------- |
| `latest`      | latest release  | Production — moving pointer to the newest release.                          |
| `<version>`   | a release       | Production — immutable pin (`2026.07.0`); roll back by pinning a prior one. |
| `stage`       | tip of `main`   | Testing — rolling build ahead of the last release.                          |
| `sha-<short>` | a `main` commit | Testing — immutable pin to an exact commit.                                 |

Stage builds show a dev-flavoured version in the navigation footer
(`2026.07.0-dev+a1b2c3d`); release builds show the clean CalVer.

While the repository (and image) is private, authenticate the host once with
a personal access token that has `read:packages`:

```sh
echo "$GHCR_PAT" | docker login ghcr.io -u <github-username> --password-stdin
```

## Deploy with Docker Compose

Pulls the released image; swap `latest` for a specific `<version>` to pin or
roll back.

```yml
services:
  genug-da:
    container_name: genug-da
    image: ghcr.io/lj-n/genug-da:latest
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./data:/app/data:rw
    logging:
      driver: json-file
      options:
        max-size: '10m'
        max-file: '5'
    environment:
      DATABASE_URL: '/app/data/genug.db'
      ORIGIN: 'https://budget.example.com'
```

Update with `docker compose pull && docker compose up -d`. To build locally
instead of pulling, replace `image:` with `build: .`.

## Reverse proxy and ORIGIN

A reverse proxy is not required by the app. It serves plain HTTP, and a
local or LAN-only instance works without one. But do not expose that
plain-HTTP port directly to the internet: put a reverse proxy in front to
terminate TLS, so passwords never cross the wire in clear. Any proxy will do
— Caddy, nginx, Traefik — and none needs anything special from the app's
side.

Whatever the setup, set `ORIGIN` to the exact public URL users type into the
browser (scheme and host, e.g. `https://budget.example.com`; for a direct
local run, `http://localhost:3000`). SvelteKit checks form submissions
against this origin for CSRF protection — with `ORIGIN` unset or wrong,
logins and every other form fail. That includes the create-admin form
covered next, so get this right before the first start.

## First admin

No seeding or bootstrap command is needed. When the app starts with an empty
database, the first visit redirects to a create-admin screen and the first
registered user becomes the administrator. That admin then creates all
further user accounts in the app — there is no open registration and no
email involved. Since anyone who reaches a fresh instance first would become
admin, register the admin user right after the first start.

## Environment variables

| Variable       | Required | Description                                                                                                                                                                                                   |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | yes      | Path to the SQLite database file, e.g. `/app/data/genug.db` (a plain path, not a `file:` URI). The app refuses to start without it.                                                                           |
| `ORIGIN`       | yes      | Public URL of the instance (`https://budget.example.com`, or `http://localhost:3000` for a direct local run). SvelteKit checks form Origin against it for CSRF; unset or wrong → every form fails. See above. |
| `PORT`         | no       | Port the server listens on. Defaults to `3000`, which the image sets and exposes. Set it to serve on a different port (map that port too).                                                                    |
| `LOG_LEVEL`    | no       | Log verbosity ([pino](https://getpino.io) levels, e.g. `debug`, `info`, `warn`, `error`). Defaults to `info`.                                                                                                 |
| `NODE_ENV`     | no       | `production` switches logs to plain JSON. Already set in the container image; set it yourself for manual runs.                                                                                                |

The server is built with SvelteKit's adapter-node, which understands further
variables (`HOST`, `BODY_SIZE_LIMIT`, proxy-header handling, …) — see the
[adapter-node documentation](https://svelte.dev/docs/kit/adapter-node#Environment-variables).

## Running without Docker

```sh
npm install
DATABASE_URL=:memory: npm run build
DATABASE_URL=./data/genug.db \
  ORIGIN=http://localhost:3000 \
  NODE_ENV=production node build
```

Migrations run automatically at startup.

## Backup and restore

All state lives in the single SQLite file at `DATABASE_URL`. The database
runs in SQLite's default journal mode, so there are no `-wal`/`-shm`
sidecar files to worry about — the one `.db` file is the whole backup.

**Cold backup (recommended):** stop the container, copy the file, start
again.

```sh
docker compose stop
cp ./data/genug.db /your/backup/location/genug-$(date +%F).db
docker compose start
```

**Hot alternative:** SQLite can produce a consistent copy while the app is
running:

```sh
sqlite3 ./data/genug.db ".backup ./genug-backup.db"
```

**Restore:** stop the app, replace the database file with the backup, start
the app.

## Upgrades and releases

Releases are CalVer-versioned (`YYYY.0M.MICRO`) and listed in
[CHANGELOG.md](../CHANGELOG.md); only user-visible changes are recorded
there. Upgrading is a pull:

```sh
docker compose pull && docker compose up -d
```

Database migrations run automatically at startup. To roll back, pin the
previous version tag (`image: ghcr.io/lj-n/genug-da:<version>`) — but note
that a newer release may have migrated the database beyond what an older
build expects, so restore the matching database backup when rolling back
across a migration.

## Password recovery

There is no self-service forgot-password flow, and none is needed. There are
two ways to recover an account.

**From the admin UI.** An administrator can reset any other user's password
from the admin page: each user row has a reset action that generates a fresh
random password and shows it once. Hand that password to the user; they log in
and change it under Settings. This covers everyday resets without touching the
server shell.

**From the server shell.** The reset CLI is bundled into every build as
`build/reset-password.js` (ADR-0015), so it is available inside the deployed
container without a source checkout, email, or SMTP configuration. Use it when
no admin can reach the UI — including to reset the sole administrator's own
password, which the admin UI deliberately cannot do.

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
