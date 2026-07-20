# ADR-0002: Remote functions are mechanical adapters over user-context

Date: 2026-07-07
Status: accepted

## Context

SvelteKit's remote functions force a layer between the client and
`src/lib/server/db/user-context`: something must call `query`/`form`/`command`.
That layer had started to accumulate behaviour of its own — a default account
note produced in `createAccount`, the `targetBalance` 0→null rule hidden in a
`||` in `editCategory` — while carrying zero tests. Meanwhile the root-redirect
load (`src/routes/(app)/+page.server.ts`) calls `createUserCtx()` directly,
bypassing the layer entirely.

Three shapes were considered for the layer: a pure security boundary (guard +
validation only), a mechanical adapter that additionally owns SvelteKit
integration, or an orchestration layer allowed to hold logic of its own.

## Decision

Remote functions are **mechanical adapters**. They may guard authentication,
validate input, translate form semantics to DB semantics (missing field vs.
cleared field), issue redirects, and refresh query caches. They must not
produce values or hold business rules. The litmus test: **if a remote function
produces a value instead of passing one through or translating it, that value
belongs in user-context.**

Server load functions are peer adapters, not bypasses. They may call
`createUserCtx()` directly, but then own their session check themselves. The
seam that matters is user-context — access control (`accessGuard`,
`hasAccess`) lives there and holds on every path.

The adapter layer stays deliberately test-free: adapters are too thin to hide
bugs, `remote-guard.ts` would require mocking SvelteKit internals to unit-test,
and the Playwright suite exercises the real client → remote → user-context
path. Tests target user-context.

## Consequences

- The only interface worth learning (and testing) is user-context.
- Behaviour found in a remote function during review is a defect by
  definition, not a judgement call.
- Loads that use `createUserCtx()` directly must check `locals.session`
  themselves — the guard helpers do not cover them.
- Existing violations in `budget.remote.ts` (`findEligibleUser`, `inviteUser`)
  are tracked as follow-up issues rather than fixed alongside this decision.
- The `transaction.remote.ts` "date/validated defaults" were **not** adapter
  violations: both are business rules that already live in user-context
  (`transaction.create` dates an undated transaction today; `transaction.edit`
  resets validation via `validated ?? false`). The schema defaults
  (`v.optional(v.boolean(), false)`) are UI convenience; the user-context lines
  are the canonical enforcement, covered by direct-`ctx` tests (#47).
- The double list query in `transaction.remote.ts` was resolved by consolidating
  transaction listing into one `page()` user-context operation (#50).
