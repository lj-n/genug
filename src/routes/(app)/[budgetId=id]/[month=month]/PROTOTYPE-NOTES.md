# Prototype notes — archive popover (#334)

Three variants of the category archive popover, switchable via `?variant=`, on the existing
`/[budgetId]/[month]` route. The trigger replaces the desktop table header's archived-page link;
the popover opens `side="right" align="start"`, max-height + scroll, per-item restore wired to the
real `restoreCategory` remote function (restored rows visibly return to the budget table).

Dev data: `local.db` is an isolated copy of the restyle worktree's dev DB, seeded with 10 archived
categories (2 real ones archived + 8 fabricated `PROTO000AAA*` rows) for scroll testing.

## Round 1 (2026-07-28)

- **A — Slim list**: minimal single-line rows, always-visible icon-only restore, w-64, no header.
- **B — Titled panel**: Popover.Header with title + count, dated card rows, labeled restore button, w-80.
- **C — Row action**: whole row is the restore button; hover/focus swaps the archived date for a
  "Restore" label, w-72, count hint at top.

Open questions (not yet prototyped):

- Mobile: the below-@3xl action row still links to the old archived page — popover vs drawer TBD.
- Accounts side: same winning pattern to be mounted next to the "Accounts" label in budget settings
  (its popover would open inside the ResponsiveModal).
- Archived detail pages: category page currently redirects away; target design = disclaimer +
  restore only (accounts already ~have this via AccountArchivedNotice, minus the balances block).

## Feedback log

### Round 2 (2026-07-28)

- User liked round 1's direction; asked for a **hybrid of A (slim list) + a title, padding kept
  tight**. Slot A replaced in place with the hybrid (old A snapshotted to
  `history/round-1-VariantA.svelte`): compact title row (`Popover.Title` + muted count, `px-2`)
  over the unchanged slim rows, popover stays `w-64 p-2`. B and C untouched for comparison.
- Session note: dev login is a minted session cookie in the DB copy (user "Ada"); "Subscriptions"
  was restored live during round 1 — restore-to-table behaviour confirmed working.

### Round 3 (2026-07-28)

- **A declared the winner of round 2** (slim list + compact title). Two follow-ups: max height
  smaller (now `max-h-48` everywhere, was `max-h-72`), and restore discoverability — the tiny
  icon-only button didn't communicate "how do I restore".
- All three slots converged on A's chrome, differing only in the restore affordance
  (round-2 files snapshotted to `history/*.svelte.bak` — renamed so svelte-check ignores them):
  - **A — Labeled button**: always-visible xs `Restore` button (interactive tint) per row.
  - **B — Row press**: the whole row is the restore button; muted icon+label always visible,
    turns interactive on hover/focus.
  - **C — Text link**: quiet always-visible `Restore` text link per row.

### Round 4 (2026-07-28)

- **C (text link) declared the restore-affordance winner.** Next ask: the popover must be
  consistent with the budget table's category/assignment popovers — tinted header strip, and the
  trigger icon staying pixel-locked with the title appearing next to it (like the table popovers
  keep name/amount in place).
- Slot C rebuilt on the `category-popover.svelte` overlay pattern (old C →
  `history/round-3-VariantC.svelte.bak`): `side="bottom" align="start"` with
  `sideOffset={-triggerHeight}` (trigger height measured via ResizeObserver in the wrapper),
  `motion="fade"`, panel `w-64 gap-0 p-0 rounded-xs bg-surface shadow-sm ring-1 ring-muted/30`,
  header strip `bg-muted/5 border-b border-muted/20 px-2` at trigger height repeating the
  ArchiveIcon with the title beside it and the muted count right-aligned. Text-link rows under a
  `max-h-48` scroll area.

### Round 5 (2026-07-28)

- **Round-4 C locked as the category archive popover design.**
- **Accounts side built** (in `src/lib/components/features/budget-settings/`):
  - Trigger: ghost xs ArchiveIcon button directly right of the small create (+) button next to
    the "Accounts" label in budget settings — mirroring the category table header. The old
    archived-page list link is removed.
  - Surface: an **extra dialog stacking over budget settings** (same sibling-root +
    `overlayClass="bg-background/30"` pattern as Add Account; closes with its parent).
    `Dialog.Title` = ArchiveIcon + "Archived Accounts" + inline muted count (count must NOT be
    `ml-auto` — it collides with the dialog's close X). Body: C-style text-link restore rows,
    `max-h-48` scroll, wired to the real `restoreAccount` — restored accounts reappear in the
    settings account list live.
- Seed data: 3 extra archived accounts fabricated (`PROTOACCT*`); categories re-archived after
  live restores emptied the archive.

### Round 6 (2026-07-29)

- **Post-lock fix:** restoring the last archived account left the account archive dialog open as
  an empty "0" shell (the `length > 0` guard only wrapped the trigger). The dialog now closes
  itself via `$effect` when the list empties; the new mobile drawer ships with the same guard
  from day one.
- **Mobile round 1** (user: "simple list there, maybe in drawer"): the `@max-3xl` action-row
  link to the old archived page is replaced by `prototype-archive-drawer.svelte` — a bottom
  `Drawer` (vaul) triggered by the same ghost "N archived" button. Centered drawer title =
  ArchiveIcon + "Archived Categories" + muted count; body = the C-style simple rows with
  text-link Restore, drawer-native scroll. Restore verified live at 390px (count updates,
  category reappears in the card list behind).
- Account side on mobile checked as-is: budget settings renders as a drawer, and the stacked
  archive **dialog** over it reads fine at 390px — open question for the user whether it should
  become a (nested) drawer for consistency.

### Round 7 (2026-07-29)

- **Mobile round 1 locked.** Archived categories on mobile = bottom drawer
  (`prototype-archive-drawer.svelte`); archived accounts on mobile stay in the stacked dialog
  over the settings drawer, as shown.

### Round 8 (2026-07-29)

- **Archived detail pages** (last piece of the original spec): both pages now show nothing but
  a disclaimer + restore.
  - Category: the redirect-to-archived-list `$effect` is gone; the page renders
    `prototype-category-archived-notice.svelte` (mirrors `account-archived-notice.svelte`) when
    `archivedAt` is set. New messages `category_archived_notice_title/description` (en + de).
  - Account: the archived branch drops `AccountBalances` + separator and keeps only
    `AccountArchivedNotice`.
  - Restore-in-place verified: submitting refreshes the page query and the full detail view
    returns without navigation.

### Final lock (2026-07-29)

- **All rounds locked.** The complete archive UX prototype: desktop category popover (round-4 C),
  accounts stacked dialog, mobile categories bottom drawer, disclaimer-only archived detail
  pages, zero-state auto-hide everywhere, live restore into the owning views.
- Prototyping phase closed; this branch is the primary source for the implementation pass.
