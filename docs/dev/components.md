# Component Conventions

- Two tiers under `src/lib/components`, separated by directory:
  - `src/lib/components/ui` — feature-agnostic primitives. No business logic, no domain imports (type-only allowed), no remote functions, no form orchestration.
  - `src/lib/components/features` — feature modules (see `CONTEXT.md`): domain-coupled components that import remote functions, orchestrate forms, and own interaction state. One directory per capability, each with an `index.ts` barrel.
- No root barrel. Consumers import from explicit paths (`$lib/components/features/account`, `$lib/components/ui/logo`) so the import path itself states the coupling.
- Prefer composition over one-off wrappers unless a wrapper adds clear feature meaning.
- Keep data loading shallow in reusable components. No substantial business logic inside presentational UI.
- Follow the existing export shape for primitives, including `index.ts` re-exports of `Root` and named parts where that pattern already exists.
- Reuse existing Tailwind Variants patterns (`tv(...)`, `cn(...)`) for shared UI primitives.
- Preserve accessibility wiring: roles, aria attributes, focus handling, keyboard affordances, sr-only labels.
- Form controls accept `aria-invalid` and render the shared error border; composite controls forward it to their focusable element.
- No hardcoded feature copy in shared UI primitives. Pass labels from callers, localize with Paraglide.
- Match existing Svelte 5 runes and snippet-based composition patterns in touched components.
- Prefer `<Name>Icon` imports in touched feature code.

## Route-local module extraction

Route-local Svelte modules (components living under `src/routes/**`) follow an explicit lifecycle:

- A route-local module graduates to `features/<domain>/` when at least one of these holds:
  - it carries complex state logic (keyboard handling, form orchestration, multi-field sync),
  - it is testable in isolation through its props/callbacks interface,
  - it is reused across routes.
- A module stays in the route when it is tightly coupled to page data, has a single call-site, and carries no independent state logic. Trivial state like a single `let open = $state(false)` toggle does not trigger extraction.
- Extraction is reactive: apply the rule when you next touch a route-local module for other work. There is no one-time audit of existing route-local modules.
- Promoted modules keep their filename and land in `features/<domain>/<name>.svelte`, where `<domain>` reflects the feature domain, not the route they came from (e.g. `table-row-create.svelte` from the accounts route lives in `features/transaction/`).
- Companion files (local `utils.ts`, sibling components) move with the promoted module only when they are used exclusively by it; otherwise they stay in the route or are extracted separately.
- Tests follow the extracted module: `features/<domain>/<name>.test.ts`, exercising state logic through the public interface (props in, events/callbacks out) — no implementation details, no DOM mocking.
- This rule is a documented convention, not a gate: there is no ESLint or build enforcement.
