# Component Conventions

- Feature components grouped by domain under `src/lib/components`.
- Shared primitives in `src/lib/components/ui` — reusable, feature-agnostic.
- Prefer composition over one-off wrappers unless a wrapper adds clear feature meaning.
- Keep data loading shallow in reusable components. No substantial business logic inside presentational UI.
- Follow the existing export shape for primitives, including `index.ts` re-exports of `Root` and named parts where that pattern already exists.
- Reuse existing Tailwind Variants patterns (`tv(...)`, `cn(...)`) for shared UI primitives.
- Preserve accessibility wiring: roles, aria attributes, focus handling, keyboard affordances, sr-only labels.
- No hardcoded feature copy in shared UI primitives. Pass labels from callers, localize with Paraglide.
- Match existing Svelte 5 runes and snippet-based composition patterns in touched components.
- Prefer `<Name>Icon` imports in touched feature code.
