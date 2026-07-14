# genug-da

A self-hosted [envelope budgeting](https://en.wikipedia.org/wiki/Envelope_system) app.

## What is genug-da?

You assign money to spending categories before you spend it — envelope
budgeting. The name is German: "genug da" roughly means "enough there".

Self-hosted, single SQLite database, no external services. You own your data.

## Features

- **Budget Plans** — Separate budgets for personal, business, etc. Each with
  its own accounts, categories, and transactions.
- **Accounts** — Map your bank accounts and credit cards. Track validated vs.
  pending balances.
- **Categories** — Organize spending areas. Archive unused ones. Set target
  balances.
- **Transactions** — Inline editing of category, date, notes, amount. Toggle
  validated. Filter by category, notes, date, amount.
- **Monthly Budget Assignment** — Assign money to categories per month. Move
  money between categories or cover overspending.
- **Multi-User** — Admin creates users. Invite others to a budget. Users manage
  their own credentials.
- **i18n** — German and English, switchable.
- **Currencies** — EUR, USD, GBP, CAD, AUD, JPY.

## Motivation

I wanted a budgeting app I can host myself, that uses the envelope method and
runs on a single SQLite file. Building it was also a good way to learn
SvelteKit, Svelte 5, and Drizzle ORM.

## Tech Stack

Svelte 5 (runes), SvelteKit 2, Tailwind CSS 4, bits-ui, Drizzle ORM,
better-sqlite3, valibot, @node-rs/argon2, Paraglide i18n, Vitest, Playwright.

## Getting Started

### Prerequisites

- Node.js 22+
- Build tools for native addons (better-sqlite3 compiles from source)

### Environment Variables

`DATABASE_URL` — path to the SQLite database file, e.g.
`file:./data/genug-da.db`. Required.

`PORT` — port the server listens on (default: `3002`).

`ORIGIN` — public URL of your instance, e.g. `https://budget.example.com`.
Required for CSRF protection when running behind a reverse proxy.

### Container images (GHCR)

Prebuilt images are published to the GitHub Container Registry at
`ghcr.io/lj-n/genug-da` (see [ADR-0012](docs/adr/0012-calver-releases-and-stage-deploy.md)):

| Tag           | Built from      | Use                                                                         |
| ------------- | --------------- | --------------------------------------------------------------------------- |
| `latest`      | latest release  | Production — moving pointer to the newest release.                          |
| `<version>`   | a release       | Production — immutable pin (`2026.07.0`); roll back by pinning a prior one. |
| `stage`       | tip of `main`   | Testing — rolling build ahead of the last release.                          |
| `sha-<short>` | a `main` commit | Testing — immutable pin to an exact commit.                                 |

Stage builds show a dev-flavoured version beside the logo (`2026.07.0-dev+a1b2c3d`);
release builds show the clean CalVer.

While the repository (and image) is private, authenticate the host once with a
personal access token that has `read:packages`:

```sh
echo "$GHCR_PAT" | docker login ghcr.io -u <github-username> --password-stdin
```

### Docker Compose (production)

Pulls the released image; swap `latest` for a specific `<version>` to pin or
roll back.

```yml
services:
  genug-da:
    container_name: genug-da
    image: ghcr.io/lj-n/genug-da:latest
    restart: unless-stopped
    ports:
      - '3002:3002'
    volumes:
      - ./data:/app/data:rw
    logging:
      driver: json-file
      options:
        max-size: '10m'
        max-file: '5'
    environment:
      PORT: 3002
      DATABASE_URL: 'file:/app/data/genug.db'
      ORIGIN: 'https://your.domain'
      NODE_ENV: 'production'
```

Update with `docker compose pull && docker compose up -d`. To build locally
instead of pulling, replace `image:` with `build: .`.

### Docker Compose (stage)

A second stack pulling `:stage` lets you try the tip of `main` before promoting
it to production. Give it its own data volume, port, and origin so it never
touches production data.

```yml
services:
  genug-da-stage:
    container_name: genug-da-stage
    image: ghcr.io/lj-n/genug-da:stage
    restart: unless-stopped
    ports:
      - '3003:3002'
    volumes:
      - ./data-stage:/app/data:rw
    environment:
      PORT: 3002
      DATABASE_URL: 'file:/app/data/genug.db'
      ORIGIN: 'https://stage.your.domain'
      NODE_ENV: 'production'
```

### Docker (standalone)

```sh
docker build -t genug-da .
docker run -p 3002:3002 -v ./data:/app/data -e DATABASE_URL=file:./data/genug-da.db genug-da
```

### Manual

```sh
npm install
DATABASE_URL=:memory: npm run build
node build
```

## Usage

Detailed docs coming soon.

## Development

```sh
npm install
DATABASE_URL=:memory: npm run dev
```

```sh
npm run test:unit       # Vitest
npm run test:e2e        # Playwright
```

```sh
npm run lint
npm run check
```

### Releasing

```sh
npm run release      # compute the next CalVer, stamp CHANGELOG.md, commit + tag
git push --follow-tags
```

Versions are CalVer (`YYYY.0M.MICRO`) and the changelog is hand-curated under
`## [Unreleased]`; see [ADR-0012](docs/adr/0012-calver-releases-and-stage-deploy.md).
