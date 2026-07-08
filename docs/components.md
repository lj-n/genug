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
