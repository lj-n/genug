# Route Conventions

- Keep route modules thin. `+page.server.ts`, `+layout.server.ts`, and route `.svelte` files should mainly compose remote functions, redirects, and presentational components.
- Prefer redirects over duplicated routing logic. The app root already redirects logged-in users into the correct budget and month route.
- Respect matcher-based params such as `[budgetId=id]` and `[month=month]` when adding routes, links, or helpers.
- Keep page-specific UI near the route. Large table rows, filters, navigators, and detail widgets used only by one route stay under that route folder.
- Move a component into `src/lib/components` only when reuse is real across multiple features.
- Keep server-only logic out of `.svelte` files. Database writes, auth checks, and permission checks go through remote functions or server modules.
- Match existing Svelte 5 runes patterns: `$props()`, `$derived(...)`, `$state(...)`, `$effect(...)`.
- Prefer async-derived remote data in components: `const foo = $derived(await getFoo(...))`.
- Use snippets and render props where the existing component API expects them.
- Keep styling aligned with the existing Tailwind utility-first approach.
- Prefer `<Name>Icon` imports in touched feature code.
