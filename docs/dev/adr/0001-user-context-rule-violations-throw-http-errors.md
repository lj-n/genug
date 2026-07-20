# ADR-0001: Domain-rule violations in user-context throw SvelteKit HTTP errors

Date: 2026-07-07
Status: accepted

## Context

Commands in `src/lib/server/db/user-context` enforce business rules (e.g. a
category may only be archived when it is archivable). When such a rule fails,
the command needs to signal it to its caller — a remote function invoked from
a form or query. Two shapes were considered: throwing SvelteKit `error(4xx)`
with a localized message, or returning a typed result union
(`{ ok: true } | { ok: false; reason: ... }`).

The UI already prevents rule-violating submissions where it can (disabled
buttons driven by server-supplied flags), so the server-side check is a
backstop against stale or forged requests — no caller consumes the failure
programmatically. All existing guards (`accessGuard`, not-found checks,
`transferAssignment` validation) already throw.

## Decision

User-context commands signal domain-rule violations by throwing SvelteKit
`error(400, m.<localized_message>())`. Result unions are not used.

When a violation concerns a single form field (e.g. a duplicate name), the
remote function may catch the `error(400)` around the specific command call
and re-signal it as a field-level issue via
`invalid(issue.<field>(error.body.message))`. The rule check stays in
user-context; the remote function only maps the thrown error onto the field
it knows the call belongs to. Non-400 errors are re-thrown unchanged.

## Consequences

- One error-signaling convention across user-context; remote functions stay
  mechanical and need no translation layer beyond the optional per-call
  field mapping.
- Callers that want to _predict_ a rule outcome must use a dedicated query
  (e.g. `category.archivability`) rather than attempting the command.
- If a future UI needs to branch on distinct failure reasons of one command,
  this decision must be revisited (per-reason queries or error bodies).
