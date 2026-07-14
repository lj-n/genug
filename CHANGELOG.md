# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions use CalVer
(`YYYY.0M.MICRO`, see [ADR-0012](docs/adr/0012-calver-releases-and-stage-deploy.md)).

Only user-visible changes are recorded here — new or changed features, bug
fixes, behaviour and UX changes, and new settings. Refactors, tests, CI, docs,
and dependency bumps get no entry.

## [Unreleased]

## [2026.07.0] - 2026-07-14

### Added

- Envelope budgeting with per-month assignment: assign money to categories, move
  money between them, and cover overspending.
- Multiple budget plans, each with its own accounts, categories, and
  transactions.
- Accounts with validated and pending balances, plus archive, restore, and
  delete.
- Categories with target balances and archive, restore, and delete.
- Inline transaction editing (category, date, notes, amount) with filtering and
  a validated toggle.
- Multi-user support: admin-created users, per-budget invitations, and
  self-service credential management.
- German and English localisation, switchable at runtime.
- Currencies: EUR, USD, GBP, CAD, AUD, JPY.
- Dark mode following the system preference, with a Settings override persisted
  across sessions.
- A muted build-version label beside the logo.
