# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions use CalVer
(`YYYY.0M.MICRO`, see [ADR-0012](docs/dev/adr/0012-calver-releases-and-stage-deploy.md)).

Only user-visible changes are recorded here — new or changed features, bug
fixes, behaviour and UX changes, and new settings. Refactors, tests, CI, docs,
and dependency bumps get no entry.

## [Unreleased]

### Fixed

- Creating a transfer now updates the counterpart account's register right
  away. After adding a transfer while viewing one account, switching to the
  other account shows the new leg immediately, without a manual page reload.

- The create-transaction and create-transfer forms no longer carry a
  half-typed draft across accounts. Switching to another account (in the same
  or a different budget) and reopening the create form now shows an empty form;
  a draft is only kept when you reopen the form on the same account.

## [2026.07.4] - 2026-07-19

### Added

- An HTTP API for native clients (the upcoming iOS app), served under
  `/api/v1` by the same instance as the web app and authenticated with a
  personal access token (`Authorization: Bearer`). It exposes the month
  envelope view, budget/account/category lists, the transaction register, and
  endpoints to capture, edit, and delete transactions, move money between
  accounts, and set or reassign category budgets. Every write returns the
  server-recomputed envelope and affected account balances in its own
  response, so a client never recomputes budget math locally. The web app and
  its behaviour are unchanged.

- Personal access tokens for API clients (the upcoming iOS app): the settings
  page gains an "API Tokens" section where you create a named token (with an
  optional expiry date), reveal it exactly once — as plaintext with a copy
  button and as a QR code encoding the server URL plus token for
  scan-to-connect — and see and revoke issued tokens, including their creation,
  last-used, and expiry dates. Tokens are stored hashed and authenticate
  requests via the `Authorization: Bearer` header.

- The category-detail stats are now grouped into a month-scoped and an
  all-time family. The viewed month's group shows a 12-month spend sparkline
  (ending at and including the viewed month, whose bar renders muted as
  partial data), the average monthly spend over the six months before the
  viewed month (young categories average only from their first activity
  onward; a dash appears until a category has any history), and the absolute
  spend difference against the previous month, labelled with the compared
  month's name (e.g. "Spend vs. Jun 2026") and showing both months' spend
  totals underneath so the comparison is verifiable at a glance. The
  all-time group keeps
  total spend and transaction count and adds the date of the category's most
  recent transaction, shown relative to today.

- New budgets now come with guidance instead of blank screens: a tutorial
  card at the top of the month view walks through the first two steps (add an
  account, create a category) with independent checkmarks and inline create
  dialogs — both create in place, without leaving the month view — and closes
  with a pointer to the first account for recording transactions. Until the
  first category exists, the month navigator, quick actions, and unassigned
  summary stay out of the way; the archived-categories link appears only once
  something is archived. The category table, the account's transaction list,
  the account dropdown, and the archived-accounts/-categories pages each show
  a deliberate empty state; the transaction list distinguishes "no
  transactions yet" (guidance plus an add-transaction action, including the
  income-is-a-transaction-without-a-category hint) from "nothing matches your
  filters" (clear-filters action), and pagination is hidden while the list is
  empty.

- The core flows — add transaction, assign money, view month, add
  account/category, and login — now meet WCAG 2.1 AA. Every step is completable
  by keyboard with a visible focus indicator, form inputs and icon-only buttons
  (the app logo, the budget-members button) carry accessible names, and the
  dense transaction table announces its sorted column to screen readers. An
  automated axe gate over these flows keeps them clean.

### Changed

- The account dropdown now hides the archived-accounts link when a budget has
  no archived accounts, instead of showing a "0 archived" link to an empty
  page. The link reappears once an account is archived.

- Category details moved from a dialog to a dedicated page. On desktop,
  clicking a category in the budget table now shows a lightweight popover with
  the viewed month's stats and a Settings link to the new page; on mobile,
  tapping a category card's name navigates straight to it. The page holds the
  familiar edit, stats, archive, and delete tiles, and archived categories
  redirect to the archived list.

- Light-theme colours were darkened slightly to meet AA contrast: the focus
  ring, success green, error red, and muted secondary text now clear the
  contrast thresholds — including where coloured text sits on its own tinted
  background (such as the "Overspent" summary and the archive/delete warnings).
  The dark theme is unchanged.

### Fixed

- The category-detail target progress now follows the viewed month. It
  previously always measured against the calendar's current month, so
  browsing past or future months showed a wrong percentage.

- The Add-Account dialog now receives keyboard focus when it opens;
  previously focus stayed on the triggering button behind the overlay.

- The container image now sets `PORT=3000` and exposes the same port. It
  previously exposed 3002 while the server listened on 3000, so a plain
  `docker run -p 3002:3002` served nothing without an explicit `PORT` env
  var. The README and self-hosting docs now agree on 3000 and document how
  to override the port and why `ORIGIN` is required.

- The README's `DATABASE_URL` examples used a `file:` URI prefix that
  better-sqlite3 does not support — copied verbatim, they crashed the
  container with "unable to open database file". The examples now use plain
  file paths.

## [2026.07.3] - 2026-07-17

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
