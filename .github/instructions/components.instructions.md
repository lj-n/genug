---
applyTo: "src/lib/components/**/*.svelte,src/lib/components/**/*.ts"
---

# Component instructions

- Feature components should stay grouped by domain under `src/lib/components`.
- Shared primitives belong in `src/lib/components/ui`; keep them reusable and feature-agnostic.
- Prefer composition over one-off wrappers unless a wrapper adds clear feature meaning.
- Keep data loading shallow in reusable components. Do not hide substantial business logic inside presentational UI.
- Follow the existing export shape for primitives, including `index.ts` re-exports of `Root` and named parts where that pattern already exists.
- Reuse existing Tailwind Variants patterns such as `tv(...)` and `cn(...)` for shared UI primitives.
- Preserve accessibility wiring, including roles, aria attributes, focus handling, keyboard affordances, and sr-only labels.
- Do not hardcode feature copy in shared UI primitives; pass labels from callers and localize user-facing text with Paraglide.
- Match existing Svelte 5 runes and snippet-based composition patterns in touched components.
- Prefer `<Name>Icon` imports in touched feature code.
