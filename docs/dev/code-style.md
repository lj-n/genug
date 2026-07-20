# Code Style

Code-level rules complementing the architecture docs. Extracted from the
dominant patterns in this repo plus official Svelte 5 idioms; deviations in
new code are defects, not taste.

## Runes discipline

- Derive, don't sync: computed values are `$derived(...)`/`$derived.by(...)`.
  `$effect` is a last resort for imperative escape hatches (DOM measurement,
  external libraries) — the app currently has **zero** `$effect` calls; keep
  it that way unless nothing else can express the behavior.
- Local UI state is a plain `let x = $state(...)`; keep it minimal (e.g. a
  single `open` flag) and colocated with its markup.
- Props are destructured inline with an inline type literal:
  `let { foo, bar }: { foo: Foo; bar?: Bar } = $props()`. No separate
  `Props` interface unless the type is reused.
- `$bindable()` only when the parent genuinely owns the value; prefer
  callback props otherwise.
- Prefer attachments (`{@attach ...}` / `Attachment`) over `onMount` for
  element-scoped behavior.
- Remote query consumption follows `docs/dev/remote-functions.md` (ADR-0003):
  `const x = $derived(await getX(...))` at script top level, never in markup.

## TypeScript idioms

- `type` aliases, not `interface`. The only `interface` declarations live in
  `src/app.d.ts` where SvelteKit's ambient module augmentation requires them.
- Domain primitives are branded types obtained through their interface —
  `Money` via `parseMoney`/`MoneySchema`, `Month` via its module — never by
  casting (see `CONTEXT.md`).
- Type casts (`as`) are a boundary tool only: DOM event targets and
  third-party library seams (`bits-ui` wrappers). Never cast to silence a
  domain type error.
- Use `import type { ... }` / inline `type` modifiers for type-only imports.
- Derive types from values where possible (`typeof`, `ReturnType`,
  `Awaited<ReturnType<typeof getX>>` for remote results) instead of
  duplicating shapes.
- No `any`; use `unknown` plus narrowing at real boundaries.

## Naming & module shape

- Files and directories are kebab-case, no exceptions (`table-row-create.svelte`,
  `sort-helper.svelte.ts`). Reactive TS modules use the `.svelte.ts` suffix.
- Module-level functions are `function` declarations; arrow functions are for
  callbacks, attachments, and inline handlers.
- Named exports only in TS modules. Barrels exist per feature/ui directory
  (`index.ts`); no root barrel (`docs/dev/components.md`).
- Import order, object keys, and Tailwind class order are machine-enforced
  (eslint-plugin-perfectionist, prettier-plugin-tailwindcss) — don't fight
  the formatter.
- Intentionally unused values are `_`-prefixed (ESLint-enforced).

## Error handling & comments

- Domain-rule violations throw SvelteKit `error(4xx, m.<localized>())` inside
  user-context (ADR-0001). Remote functions may catch a specific `error(400)`
  only to re-signal it as a field issue; non-400s are re-thrown.
- `try`/`catch` is rare and purposeful: adapter field mapping and browser-API
  utilities. Never swallow an error silently; caught-but-unused errors are
  named `_`.
- Request-scoped logging goes through `event.locals.logger` (wired in
  `hooks.server.ts`); no `console.*` in server code.
- Comments state constraints and _why_, not _what_ — e.g. why event delegation
  is needed, why a retry exists. No narration of the next line, no
  change-log-style comments. JSDoc sparingly, for non-obvious helper
  semantics (`/** Locates a category's row ... */`).
- No ASCII-art divider comments (`// ── section ──`). Sections are
  communicated by function boundaries, `describe` blocks, and blank lines.
- User-facing text always goes through Paraglide `m.*` messages — no
  hardcoded copy, including error messages.
