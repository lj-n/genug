# ADR-0013: Modals cap to the viewport and scroll behind a Body seam

Date: 2026-07-14
Status: accepted

## Context

genug's modals — the `Dialog` (bits-ui), the bottom `Drawer` (vaul-svelte), the
`ResponsiveModal` shell that switches between them at `(min-width: 640px)`, and
the `AlertDialog` confirmations — grew to hold large content. Category detail and
account settings are `max-w-4xl` dialogs with stats, edit, archive, and delete
sections.

`dialog-content` was `fixed inset-0 m-auto h-fit` with no `max-height` and no
`overflow`: on a short viewport the dialog grew past the top and bottom edges and
pushed its close button and actions off screen with no way to scroll them back.
This bit hardest on an iPad in landscape — wide enough (1024–1366px) to stay
above the 640px breakpoint and render the centered Dialog, but only 768–834px
tall, so the tall dialogs overflowed and could not be closed.

## Decision

**Every modal is bounded to the viewport and scrolls behind a single `Body`
seam.** The content primitives become a capped flex column with a pinned header
and footer:

- `Dialog.Content` / `Drawer.Content` are `flex flex-col`, capped
  (`max-h-[calc(100dvh-2rem)]` for the dialog, the existing `max-h-[80vh]` for the
  drawer) and `overflow-hidden`, so the frame — and the dialog's absolutely
  positioned close button — never leaves the viewport.
- `Dialog.Body` / `Drawer.Body` (`min-h-0 flex-1 overflow-y-auto`) are the one
  scrolling region. `Header` and `Footer` are `shrink-0` and stay pinned.
  `ResponsiveModal.Body` delegates to whichever primitive is active, matching the
  existing `Header`/`Footer`/`Title` delegation.
- `DialogForm` wraps its fields and error in `Dialog.Body`, so every form dialog
  inherits the contract for free. The two large bespoke modals — category detail
  and account settings — opt their content into `Body` explicitly.
- `AlertDialog.Content` gets the defensive cap (`max-h-[calc(100dvh-2rem)]
overflow-y-auto`) as a plain block scroll; confirmations are small and keep no
  separate `Body` seam.

Height uses `dvh` so the iOS Safari dynamic toolbar does not clip the dialog.

The `ResponsiveModal` keeps its **width-based** switch (Dialog at ≥640px, Drawer
below). iPads in landscape therefore keep the Dialog — now viewport-bounded and
scrollable, which is what made it overflow-proof.

## Rejected alternatives

- **Switch the shell to a bottom Drawer on touch** (discriminate with
  `(min-width: 640px) and (pointer: fine)` so `pointer: coarse` iPads get a
  sheet). This was the intuitive fix — a bottom sheet is more ergonomic on a
  short landscape viewport than a centered dialog — and it is why `ResponsiveModal`
  exists at all. **Rejected:** a form confirmed from an alert dialog _nested
  inside_ a vaul drawer does not reliably refresh its queries. SvelteKit's
  single-flight `refreshAll()` **and** its default post-submit query refresh are
  both dropped on that nested path, while a plain Dialog (bits-ui, which
  coordinates nested dismissible layers) handles it correctly. Concretely,
  deleting a category from the detail drawer left a stale row in the budget table;
  a direct submit in the drawer (archive) was fine — only the nested-confirm path
  broke. The defect resisted several fixes (refresh strategy, explicit client
  `.refresh()`, `interactOutsideBehavior=defer-otherwise-close`) and it pre-exists
  for the narrow-viewport drawer this ADR leaves unchanged. With the viewport cap
  and `Body` scroll the Dialog is already fully usable on iPad, so the drawer
  switch was not worth shipping the regression. The same reasoning kept account
  settings a plain `Dialog` rather than migrating it to the responsive shell.
- **Whole-content scroll with a pinned close button.** Cap the container and put
  `overflow-y-auto` on it, converting the close button to sticky. One-line change,
  but the footer actions scroll away with the body and it does not match the
  drawer's need for a distinct scroll region. The `Header`/`Body`/`Footer` seam
  keeps controls pinned and is symmetric across both primitives.

## Consequences

- `Body` is now part of the modal vocabulary: a modal's scrollable middle goes in
  `Dialog.Body` / `Drawer.Body` / `ResponsiveModal.Body`, and `Header`/`Footer`
  stay pinned. Form dialogs get this for free through `DialogForm`.
- The reported iPad-landscape overflow is fixed for the Dialog directly, without a
  shell change — no new responsive behaviour, no new device-class assumptions.
- A follow-up remains open: the narrow-viewport (and any future touch) Drawer
  still drops query refreshes for forms confirmed through a nested alert dialog.
  Revisiting the touch-drawer switch depends on resolving that vaul × remote-form
  interaction.
- **Resolved (#147):** the dropped refresh was not a vaul × bits-ui layer
  problem. The delete form never chained `.updates(...)`, so the server's
  `requested(...).refreshAll()` was a silent no-op and the client fell back to
  `invalidateAll()` — which re-fetched the deleted category's own detail
  queries (404) and raced the drawer teardown, discarding the table update.
  With `.updates(...)` declared at the submit site the refresh arrives in the
  form response itself and the drawer path is reliable; the touch-drawer
  switch is no longer blocked by this defect.
