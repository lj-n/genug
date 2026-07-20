# ADR-0010: Dark mode via token override, cookie-persisted override, media-query system default

Date: 2026-07-14
Status: accepted

## Context

genug already themes through semantic tokens: `src/routes/layout.css` declares
the palette as `@theme` `--color-*` variables (surface, surface-high,
background, foreground, muted, error, info, interactive, success, focus), and
components consume them through semantic utilities (`bg-background`,
`text-foreground`, `bg-muted`) rather than raw palette classes. That makes dark
mode cheap — the values can change without touching components — but before this
decision there were no dark values, no way to pick a theme, and no story for
avoiding a flash of the wrong theme on load (#134, part of the public-release
milestone #128).

The hard constraint: **`prefers-color-scheme` is a browser-only signal.** On the
first request the server cannot know the visitor's OS preference, so "follow the
system, resolved server-side, without a flash" cannot mean the server always
emits a concrete `dark`/`light` class. Something has to give for the system case.

Three shapes of the resolution problem were considered (server-class-only,
companion cookie holding the detected scheme, inline blocking `<head>` script),
and, orthogonally, two shapes of the styling mechanism (override token values,
or Tailwind `dark:` variants).

## Decision

**Theming is token-value override, and nothing else.** Dark values are declared
by re-defining the same `--color-*` variables under `.dark` and under
`@media (prefers-color-scheme: dark)`. Components never branch on theme: they
consume tokens, and the tokens carry the theme. No Tailwind `dark` custom-variant
is registered, so `dark:*` utilities are not available by construction — a
contributor who wants a surface to differ in dark mode changes its token, not the
component.

**The active theme is a per-device Theme override** (see the glossary in
`CONTEXT.md`) held in the `theme` cookie, resolved by one pure function:

```ts
// src/lib/utils/theme.ts
resolveThemeClass(cookieValue?: string): 'dark' | 'light' | null
//  'dark'    -> 'dark'
//  'light'   -> 'light'
//  'system'  -> null   (no class — the media query decides)
//  undefined -> null
//  anything else -> null
```

- **Server (SSR, no flash for overrides).** A dedicated `handleTheme` handle in
  the `hooks.server.ts` sequence reads the cookie, calls `resolveThemeClass`, and
  replaces the `%theme%` placeholder on `<html class="%theme%">` in `app.html`
  via `transformPageChunk` — `null` becomes an empty string. This mirrors the
  existing `%paraglide.lang%`/`%paraglide.dir%` mechanism and stays independent of
  the i18n middleware.
- **System (no flash, zero JS).** When the resolver returns `null` no class is
  emitted and `@media (prefers-color-scheme: dark)` in `layout.css` selects the
  theme purely in CSS. The `.dark`/`.light` class blocks are placed _after_ the
  media block so an explicit override wins by source order (equal specificity).
- **Client (instant apply, self-host friendly).** The switcher writes the cookie
  directly with `document.cookie` (`Path=/`, `Max-Age≈400 days`, `SameSite=Lax`,
  **no `Secure`**) and toggles the class on `document.documentElement` with the
  same shared resolver, for instant feedback with no round-trip. There is no
  remote function: theme has no `user-context` and no DB row, so a
  `guardedCommand` would adapt nothing (ADR-0002).
- **Control.** A three-state segmented control (System / Light / Dark) built on a
  new `ui/toggle-group` primitive, composed by a `features/theme` component; the
  selected segment is `cookie value ?? 'system'`.

The Theme override is a **device preference, not an account setting** — it lives
in a cookie and is never written to the user record or synced across browsers.

## Rejected alternatives

- **A `dark:` variant escape hatch.** Registering `@custom-variant dark` alongside
  the token override would allow one-off `dark:*` tweaks for things that do not
  map to a token. Rejected: it invites per-component theme branching and erodes
  the single-source-of-truth discipline that makes this whole feature a
  no-component-sweep change; once `dark:*` spreads, clawing it back is exactly the
  sweep we avoided.
- **Companion cookie holding the detected system scheme** (client writes
  `prefers-color-scheme`, server always emits a concrete class). Rejected: the
  very first visit, before the cookie exists, still flashes, and it adds a
  client-write step for no gain over the media query.
- **Inline blocking `<head>` script** that resolves cookie + `matchMedia` before
  paint. Works, but pushes resolution to the client and contradicts the ticket's
  requirement that `hooks.server.ts` set the class server-side.
- **Remote command + `invalidateAll`.** Architecture-consistent on the surface,
  but a server round-trip and a full re-run of every `load` for a purely visual
  toggle — and it would still need an instant client toggle to avoid flashing
  during the trip. No domain logic justifies the adapter.
- **Full reload** (mirroring paraglide's `setLocale`, the adjacent language
  switcher's behaviour). Simplest and most consistent with the neighbour, but a
  jarring full page reload for a theme flip when a class swap is instant.
- **`Secure` on the cookie.** Marginally more correct for a public HTTPS
  deployment, but silently drops the cookie — breaking theme persistence — for the
  self-hosters serving genug over plain HTTP that this milestone targets. The
  preference is non-sensitive, so `Secure` is omitted.

## Consequences

- Adding a new themed surface means adding a token and its dark value, never a
  `dark:` utility. The invariant is enforced by the absence of the variant, not by
  review.
- System mode needs zero JavaScript and emits no server class; overrides are
  flash-free because the class is present in the SSR HTML.
- The tested unit is `resolveThemeClass` (cookie string → class), exercised
  directly; `handleTheme` and the client toggle are thin wrappers over it.
- The light _and_ dark token values produced here are AA-contrast-verified once in
  the accessibility pass (#8), which this ticket blocks — the values are a first
  pass, finalised there.
- Login and other unauthenticated pages are themed too: the cookie is read in
  hooks before auth matters, and the media query covers the rest.
- The theme does not follow a user across devices; that is accepted for a
  non-sensitive device preference and keeps recovery/self-host free of an extra
  synced setting.
