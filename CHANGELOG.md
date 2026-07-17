# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions use CalVer
(`YYYY.0M.MICRO`, see [ADR-0012](docs/adr/0012-calver-releases-and-stage-deploy.md)).

Only user-visible changes are recorded here — new or changed features, bug
fixes, behaviour and UX changes, and new settings. Refactors, tests, CI, docs,
and dependency bumps get no entry.

## [Unreleased]

### Fixed

- The New Transaction and Transfer buttons now toggle their inline create row:
  clicking the button again cleanly closes the open row instead of making it
  flicker, and clicking the other button switches directly to the other row.

- Deleting a category or account from the detail view on a narrow (phone)
  viewport now removes the row from the budget table immediately; previously
  the deleted entry could linger until a page reload.

### Added

- Money can now be moved between two accounts of the same budget as a
  transfer: a linked pair of transactions — an outflow in the source account,
  an inflow in the destination. Transfers carry no category and never touch
  the budget math (envelope activity, Unassigned). A dedicated Transfer button
  next to New Transaction opens an inline row on desktop or a bottom sheet on
  mobile; the amount is signed from the viewed account's perspective (negative
  leaves it). The register shows the counterpart account ("→ Savings" /
  "← Checking") in the category column, and a "Transfers" entry in the
  category filter lists only transfer legs. Editing a leg edits the whole
  transfer, deleting a leg deletes both sides, and each leg is validated
  individually against its own account statement.
- A forgotten password can now be reset from the server shell:
  `node build/reset-password.js <username>` (inside the container via
  `docker exec`) prints a fresh random password and signs the user out of all
  sessions. Works on any deployment without email/SMTP configuration — see
  `docs/self-hosting.md`.
- The app now links to its source code repository from the navigation sidebar,
  the mobile navigation drawer, and the login screens, as required by the
  AGPL-3.0 §13 source offer. genug-da is licensed under AGPL-3.0-only. The
  version number moved from beside the logo to sit next to the source link.

### Changed

- The app is now usable on phones: the transaction register reflows to a
  date-grouped card list, the monthly budget table to category cards, and the
  month header stacks with a full-width unallocated band on narrow screens.
  Creating and editing transactions and assigning money open a bottom sheet on
  mobile; drag-reorder and moving money between categories stay desktop-only
  for now. On phones the register loads further transactions with a "Load
  more" button instead of page numbers, transaction filters are desktop-only,
  the account balance summary stacks vertically, and the navigation toggle
  floats in the bottom-right corner instead of covering the page heading.
  Dialog action buttons sit in a consistent row on every screen size.

### Fixed

- The mobile navigation drawer scrolls its budget and account list instead of
  overflowing past the bottom edge of the sheet.
- Large dialogs (category detail, account settings) no longer overflow the
  screen on iPads in landscape. Every dialog is now capped to the viewport
  height and scrolls its body, so its title, close button, and actions stay on
  screen and reachable instead of spilling off the top and bottom of a short
  viewport.

## [2026.07.2] - 2026-07-14

### Added

- GitHub Releases are now published automatically on each version tag, with the
  matching changelog section as the release notes.

## [2026.07.1] - 2026-07-14

### Added

- Multi-architecture container images (`linux/amd64` and `linux/arm64`), so the
  published images run natively on ARM64 hosts.

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
