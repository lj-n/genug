# ADR-0009: Form feedback follows the origin rule; submit lifecycle behind one primitive

Date: 2026-07-13
Status: accepted

## Context

The app has ~27 form sites and, before this decision, no single contract for
how a form talks back to the user. Five distinct error-handling patterns and
five success-feedback patterns coexisted; thrown errors (authorization,
not-found, unexpected server failures) were silently swallowed in at least six
sites; only one submit button in the whole app disabled while a request was in
flight. The full submit lifecycle — reset error → submit → catch → normalize →
route feedback — was implemented completely only inside `DialogForm`; every
other site re-decided it from scratch, usually partially.

Feedback also had no principle for _where_ it appears: some actions toasted,
some cleared the form, some did nothing, regardless of whether the user could
already see the effect.

## Decision

**Every form is either a Contained form or a Standing form** (see the glossary
in `CONTEXT.md`), and feedback follows the **origin rule**: it appears at the
element the user is already looking at.

| Form context                                           | Success signal                       | Validation errors             | Thrown errors (403/404/500/…)                   |
| ------------------------------------------------------ | ------------------------------------ | ----------------------------- | ----------------------------------------------- |
| Contained form (dialog / alert-dialog / popover)       | container closes                     | inline at the field           | inline alert in the container, which stays open |
| Standing form with no visible change at the origin     | anchored success toast               | inline at the field           | anchored error toast                            |
| Standing form whose success visibly changes the origin | the visible change itself — no toast | inline at the field           | anchored error toast                            |
| Create-then-navigate                                   | the redirect                         | inline at the field           | anchored error toast                            |
| Row-scoped micro-form                                  | row exits edit mode / updates        | shared error line for the row | anchored error toast                            |

Thrown errors are never silent anywhere. Toasts are reserved for outcomes,
never progress.

**The submit lifecycle exists exactly once**, in `createFormSubmit`
(`src/lib/utils/form-submit.svelte.ts`): per submit it clears the previous
error, submits (chaining `updates` single-flight refreshes), runs `onSuccess`
and the optional success toast, and routes thrown errors through the existing
normalizer (`normalizeFormError`, ADR-0001 messages surface verbatim,
everything else maps to the generic localized fallback).

**Toast-owns-errors:** when the primitive's `toast` option is configured,
thrown errors go to the anchored error toast and the returned `error` state
stays `null`; without it, they land in `error` for inline rendering. Exactly
one error surface is ever active per form — no site checks two channels.

Containers (`DialogForm`, and its planned alert-dialog and popover siblings)
are thin skins over the primitive: they render container markup, the inline
thrown-error alert, and hand `pending` to their footer snippet. Pending state
reaches the user through the `Button` `loading` prop — delay-gated spinner,
stable size, disabled and busy semantics. Hot-path forms (see glossary) stay
exempt: their optimistic model is its own feedback.

## Rejected alternatives

- **Toast-everywhere.** One uniform success/error toast for all forms is easy
  to implement but violates the origin rule twice: a contained form's close is
  already the signal (a toast on top is noise), and a visible change at a
  standing form's origin (item appears, moves, leaves) says more than any
  toast. Toasts would degrade into background chatter and stop meaning
  anything precisely where they are needed (password change, invite).
- **Per-container lifecycle duplication.** Giving each container (dialog,
  alert-dialog, popover) and each bare site its own try/catch-and-route
  implementation is the status quo that produced five error patterns and six
  silent-failure sites. The lifecycle is subtle (error reset timing, update
  chaining, exactly-one-surface) and must not be re-derived per site.
- **One mega form component.** A single `<AppForm>` that renders container,
  fields, errors, and footer for every context would need props for every
  variation (dialog vs popover vs bare, footer shapes, reset semantics,
  row-scoped layouts) and would still exempt the dense transaction rows. A
  headless primitive composes into all of these without owning markup.

## Consequences

- New form sites wire feedback by composing `createFormSubmit` (or a container
  built on it) instead of hand-rolling try/catch — getting error routing,
  pending state, and cache refresh for free.
- The lifecycle is unit-tested once at the primitive's public surface;
  containers test only container behavior against fixtures; migrated sites
  need no per-site lifecycle tests.
- `DialogForm` takes the remote form object directly (breaking API change,
  all sites migrated with the refactor); its footer snippet receives
  `pending` alongside the form id so submit buttons forward it without
  reaching into the form object.
- The migration to this contract is sliced per domain (containers, settings,
  auth, admin, categories, accounts, transaction rows) and is consistent
  within each domain at every merge.
