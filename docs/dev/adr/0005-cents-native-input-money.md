# ADR-0005: InputMoney is cents-native and owns its editing model

Date: 2026-07-12
Status: accepted

## Context

Amount entry ran through `@canutin/svelte-currency-input`, wrapped by our
`InputCurrency` (renamed `InputMoney` in #59). The library treats a formatted
_string_ as the source of truth, which forced the wrapper into a
cents↔float↔string triple conversion, an `$effect` reconciling two shadow
states, and a ~25-prop pass-through surface consumers barely used. The
string-first model also produces a null/number ambiguity for the bound value:
every consumer form invented its own fallback, and a cleared field could snap
back to its previous value instead of meaning zero — the #52 bug class, whose
fix (#57) still left a cleared field displaying empty until the value
round-tripped.

## Decision

The dependency is removed and replaced by an own, cents-native `InputMoney`
(#58, #60).

- **Integer cents are the single source of truth.** The bound `value` is a
  non-nullable plain number of cents (the form-field currency; not the
  branded `Money` type — user-context keeps owning null semantics such as "no
  target balance"). The hidden form input always submits a valid integer
  string; empty text and a bare minus parse to 0.
- **Format on blur, plain text while focused.** Keystrokes are filtered via
  `beforeinput` (digits, one leading minus, one decimal separator — first of
  `,` or `.` typed wins — max 2 decimals); no live reformatting or caret
  management. Blur re-renders through the domain `formatMoney` in the runtime
  locale. The displayed text _derives_ from focus state and cents, so
  external value writes reset the text only while unfocused — no `$effect`,
  no shadow state.
- **Pastes are parsed tolerantly** (strip symbols/spaces; with both `.` and
  `,` the last one is decimal; a lone separator is decimal before 1–2 digits,
  grouping before 3); unparseable pastes are ignored.
- **The text rules are pure functions** in `money-text.ts` colocated with the
  component, table-driven-tested, and deliberately outside
  `$lib/utils/money`, which stays the domain seam for the branded `Money`.
- **The API is hard-pruned** to `currency`, bindable `value`, bindable `ref`,
  `selectOnFocus`, plus standard input attributes; the value callbacks and
  the `locale` prop are gone (`bind:value` is the contract; the component
  reads the runtime locale itself).

## Consequences

- Null/0 ambiguity is structurally impossible: consumers bind cents directly
  without fallbacks, and a cleared field submits 0 and shows formatted zero
  after blur.
- Amount-entry behavior is fully owned and cheap to verify: separator and
  paste rules change as pure-function edits with table tests, not upstream
  library surprises.
- The formatted display is produced by the same `formatMoney` used everywhere
  else, so input display and read-only amounts cannot drift apart.
- Editing behavior (e.g. group separators while typing) is deliberately
  minimal; any future richening happens in our own component under the same
  cents contract.
