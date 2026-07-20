# genug-da

[![CI](https://github.com/lj-n/genug-da/actions/workflows/ci.yml/badge.svg)](https://github.com/lj-n/genug-da/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/tag/lj-n/genug-da?label=release)](CHANGELOG.md)
[![License: AGPL-3.0-only](https://img.shields.io/badge/license-AGPL--3.0--only-blue)](LICENSE)

A self-hosted [envelope budgeting](https://en.wikipedia.org/wiki/Envelope_system) app.

## What is genug-da?

You assign money to spending categories before you spend it — envelope
budgeting. The name is German: "genug da" roughly means "enough there".

Self-hosted, single SQLite database, no external services. You own your data.

## Screenshots

Assign each month's money to categories — targets fill up, overspending shows
in red.

![The budget month view: categories with their assigned budget, activity, and
remaining balance, with one category overspent.](docs/screenshots/budget.png)

Record transactions per account and edit category, date, notes, and amount
inline; toggle each between pending and validated.

![An account's transactions: a list with category, notes, date, and amount,
each marked pending or validated.](docs/screenshots/transactions.png)

## Features

- **Budget Plans** — Separate budgets for personal, business, etc. Each with
  its own accounts, categories, and transactions.
- **Accounts** — Map your bank accounts and credit cards. Track validated vs.
  pending balances. Transfer between accounts.
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

## Deploy

Prebuilt images are published to `ghcr.io/lj-n/genug-da`. A minimal Docker
Compose stack:

```yml
services:
  genug-da:
    image: ghcr.io/lj-n/genug-da:latest
    restart: unless-stopped
    ports:
      - '3000:3000'
    volumes:
      - ./data:/app/data:rw
    environment:
      DATABASE_URL: '/app/data/genug.db'
      ORIGIN: 'https://your.domain'
```

The first login on a fresh instance creates the admin user.

For the full picture — image tags and rollback, reverse proxy and `ORIGIN`,
all environment variables, running without Docker, backups, upgrades, and
password recovery — see [docs/self-hosting.md](docs/self-hosting.md).

## Usage

[docs/usage.md](docs/usage.md) walks through the app feature by feature:
first login, budget plans, accounts, categories, monthly assignment,
transactions and transfers, multi-user, and settings.

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
`## [Unreleased]`.

## Contributing

See [CONTRIBUTING](.github/CONTRIBUTING.md).

## License

genug-da is licensed under the [GNU Affero General Public License v3.0 only](LICENSE) (AGPL-3.0-only).

Copyright (C) 2026 Linus Johannsen
