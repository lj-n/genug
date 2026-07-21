<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/header-dark.svg">
    <img src="docs/header-light.svg" width="360" alt="genug-da">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/lj-n/genug-da/actions/workflows/ci.yml"><img src="https://github.com/lj-n/genug-da/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/github/v/tag/lj-n/genug-da?label=release" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0--only-blue" alt="License: AGPL-3.0-only"></a>
</p>

<p align="center">
  <a href="docs/usage.md">Guide</a> ·
  <a href="docs/self-hosting.md">How to Setup</a>
</p>

You assign money to spending categories before you spend it — [envelope budgeting](https://en.wikipedia.org/wiki/Envelope_system). Self-hosted, single SQLite file, no external services: you own your
data.

Budgets are shareable: invite a partner, flatmates, or a business into the same
budget, each managing their own login.

The name is german — "genug" means "enough".

## Screenshots

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/budget-dark.png">
    <img src="docs/screenshots/budget.png" width="70%" alt="The budget month view: categories with their assigned budget, activity, and remaining balance, with one category overspent.">
  </picture><br>
  <sub>Assign each month's money to categories — targets fill up, overspending shows in red.</sub>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/transactions-dark.png">
    <img src="docs/screenshots/transactions.png" width="70%" alt="An account's transactions: a list with category, notes, date, and amount, each marked pending or validated.">
  </picture><br>
  <sub>Record transactions per account; edit category, date, notes, and amount inline; toggle each between pending and validated.</sub>
</p>

## Features

- **Shared budgets** — Invite others into a budget; each manages their own
  login. Admin provisions users.
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
- **i18n** — German and English, switchable.
- **Currencies** — EUR, USD, GBP, CAD, AUD, JPY.

## Deploy

Runs as a single Node.js container against one SQLite file — no external
database, cache, or services.

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

## Motivation

I wanted an envelope budgeting app for personal use that I could self-host and
keep my own data in: one SQLite file, no external services.

## Development

```sh
npm install
npm run dev
```

A committed `.env` supplies a `DATABASE_URL=local.db` default, so no prefix is
needed. Override it in `.env.local` (gitignored) if you want a different path.

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
