# PWA Standalone-Mode Readiness Audit

## TL;DR

**Gap count by category:**
- Navigation completeness: 0 gaps (all screens have in-app return paths)
- iOS safe-area handling: 1 gap area (viewport-fit not configured — currently letterboxed; adopting `viewport-fit=cover` requires safe-area padding on the mobile nav FAB and drawer)
- External-link safety: 0 gaps (the single external link is correctly marked up for standalone)

---

## 1. Navigation Completeness

Walk of the full route tree confirms all screens have in-app navigation paths when using the standard UI. No dead ends found.

### Route Map

**Auth flow:**
- `/login` → login form with SourceLink at bottom; redirects to `/login/first` if first user
- `/login/first` → registration form with SourceLink at bottom; submits to auth, then app redirects to first budget
- Both pages render a logo that links nowhere (SVG), then form, then SourceLink. No navigation away except via form submission.

**App shell (authenticated):**
- Root `src/routes/(app)/+layout.svelte` wraps all app routes with:
  - `NavigationMobile` (drawer with budget list, create-budget, settings, admin, logout)
  - `Navigation` (sidebar with same links, visible at `@7xl/main`)
  - Both include:
    - Logo link to `resolve('/')` — app root, which redirects to first budget + current month
    - Budget selector (dynamic list from `getBudgets()` and `getAccounts()`)
    - "New Budget" link → `/(app)/new`
    - Settings link → `/(app)/settings`
    - Admin link (if user.isAdmin) → `/(app)/admin`
    - Sign-out button → form submission to `signout` remote function

**App root (entry point):**
- `src/routes/(app)/+page.server.ts`: Loads logged-in user, gets first budget, redirects to `/(app)/[budgetId=id]/[month=month]`
- No user-visible page rendered (pure redirect).

**Budget month view:**
- `src/routes/(app)/[budgetId=id]/[month=month]/+page.svelte`
- Header: Budget name + buttons (BudgetSettings, AccountDropdown, BudgetUserManager)
- Content: Month navigator + UnassignedSummary + CategoryBudgetTable (can open category detail dialog)
- All controls either:
  - Navigate to other routes via `resolve()` and `goto()`
  - Open modals (dialogs/drawers) that close back to this view
- Exit: Logo link back to app root, navigation drawer for budget/account list, settings/logout in nav

**Budget creation (first-time flow):**
- `src/routes/(app)/new/+page.svelte`
- Form to create budget
- Success redirects to first budget month view (via `+page.server.ts` load logic)
- Exit: Logo link to app root (which then redirects to newly created budget)

**Account list (inside budget):**
- Accessed via AccountDropdown in month view header or via navigation drawer
- No dedicated page; list is modal/drawer based
- Each account name links to account detail page

**Account detail:**
- `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.svelte`
- Header: Account name + AccountSettings button
- Content: AccountArchivedNotice (if archived) + AccountBalances + TransactionTable
- All controls navigate back to budget month view or open modals
- Exit: Header navigation, logo link, or drawer nav

**Account creation:**
- `src/routes/(app)/[budgetId=id]/accounts/new/+page.svelte`
- Form via `AccountCreate` component
- Success redirects to account detail page
- Exit: Logo link to app root, or via drawer nav (close drawer before accessing new page)

**Account archival:**
- Form in AccountSettings modal
- Success redirects to `/(app)/[budgetId=id]/accounts/archived` via `onArchived` prop
- Exit: Link back to any budget month view (via nav drawer or logo)

**Archived accounts:**
- `src/routes/(app)/[budgetId=id]/accounts/archived/+page.svelte`
- List of archived accounts with restore buttons
- Each account name links back to account detail (which shows archived notice)
- Exit: Logo link to app root, navigation drawer to other budgets/accounts/pages

**Category creation:**
- `src/routes/(app)/[budgetId=id]/categories/new/+page.svelte`
- Form to create category
- Success redirects to budget month view via `goto(resolve('/(app)/[budgetId=id]', ...))`
- Exit: Logo link to app root, or drawer nav

**Archived categories:**
- `src/routes/(app)/[budgetId=id]/categories/archived/+page.svelte`
- List of archived categories with restore buttons
- Each category name links to budget month view
- Exit: Logo link to app root, navigation drawer

**Settings:**
- `src/routes/(app)/settings/+page.svelte`
- Forms for username, password, theme, language
- All are standing forms (no navigation, only toasts on success)
- Exit: Logo link, navigation drawer, navigation links at top

**Admin panel:**
- `src/routes/(app)/admin/+page.svelte`
- User management (create, reset password, delete)
- Database reset (danger zone)
- All mutations via forms; no navigation on success
- Exit: Logo link, navigation drawer

**Error page:**
- `src/routes/+error.svelte`
- Shows error status + message + log ID
- **Has link:** `<a href={resolve('/(app)')} class="link">{m.error_page_go_home()}</a>` (line 22)
- Returns user to app root, which redirects to budget or new-budget or login as needed
- **Not a dead end.**

### Navigation Assessment

**Explicit checks:**
1. Logo in every layout: `resolve('/')` → app root → redirects logged-in user to first budget, or to login if not authenticated
2. Navigation drawer (mobile) in `src/routes/(app)/navigation-mobile.svelte` (line 92): Closes on any link click via `closeDrawerAttachment` (lines 32–48)
3. All form submissions redirect on success (create-then-navigate pattern for new budget, new account, new category)
4. Standing forms (username, password, theme, language, admin actions) show toasts but don't navigate — user can continue using the page
5. Modal dialogs (category detail, account settings) close back to the originating view
6. Sidebar navigation in `src/routes/(app)/navigation.svelte` (lines 64–116): Sticky, always visible above the breakpoint; below it, drawer nav replaces it

**Gaps found:** None. Every screen has an in-app way out.

---

## 2. iOS Safe-Area Handling

### Viewport Meta Configuration

`src/app.html` (lines 1–15):
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

**Finding:** No `viewport-fit=cover` present. **Current behavior: letterboxed.**

Without `viewport-fit=cover`, the app renders inside the safe area (below status bar, above home indicator on notch/Dynamic Island devices). The body background will be the full viewport color, but the app content stays inset. This is the default and safe, but leaves black/system bars visible on the sides.

With `viewport-fit=cover`, content can extend under the notch/Dynamic Island, requiring explicit safe-area insets on any fixed UI.

### Safe-Area CSS Check

**Grep results across `src/**/*.{svelte,css}`:** No instances of `safe-area-inset`, `env()`, or `viewport-fit` found (beyond the question itself).

### Fixed/Sticky UI Inventory

1. **Navigation sidebar:** `src/routes/(app)/navigation.svelte` (line 64)
   - `sticky top-8` → sticks to `top: 2rem` (32px below viewport top)
   - Desktop only (`@7xl/main:flex`), hidden on mobile
   - **Impact:** Desktop only, not a standalone notch concern

2. **Mobile navigation trigger:** `src/routes/(app)/navigation-mobile.svelte` (line 57)
   - `fixed right-4 bottom-4 z-40` → bottom-right corner FAB
   - Visible only on mobile (`@7xl/main:hidden`)
   - **Impact:** Would sit at `bottom: 1rem; right: 1rem` (16px from edges)
   - **On standalone iOS:** Would sit above home indicator, potentially overlap (no `padding-bottom: env(safe-area-inset-bottom)`)

3. **Drawer content:** `src/lib/components/ui/drawer/drawer-content.svelte` (lines 27–28)
   - `fixed z-50` with `max-h-[80vh]`
   - Bottom drawer: `inset-x-0 bottom-0 rounded-t-xl`
   - **Impact:** Drawer slides up from bottom, covers home indicator area
   - ADR-0013 addresses viewport capping; ADR-0014 mentions bottom drawer at `max-h-[80vh]`
   - **Current:** Would cover home indicator on standalone without `padding-bottom`

4. **Dialog content:** `src/lib/components/ui/dialog/dialog-content.svelte` (line 38)
   - `fixed inset-0 m-auto ... max-h-[calc(100dvh-2rem)]`
   - Centered dialog, capped to viewport
   - Uses `100dvh` (dynamic viewport height), which iOS Safari adjusts for the toolbar
   - **Impact:** Dialog stays in viewport; safe from notch because it's centered and inset from edges
   - **Good:** `100dvh` already accounts for dynamic toolbar

5. **Modals with Body scroll (ADR-0013):** 
   - Dialog and Drawer both cap height and scroll `Body` behind header/footer
   - No fixed footers inside modals
   - **Good:** Content scrolls, controls stay pinned

### Summary: Safe-Area Readiness

**Current state:** Letterboxed (safe), no notch overlap.

**Gaps:**
1. **Viewport-fit not configured:** If enabled later (`viewport-fit=cover`), the mobile navigation FAB (`bottom-4 right-4`) and drawer bottom edge would need `safe-area-inset` padding. Drawer is specifically problematic: `max-h-[80vh]` can exceed viewport if the home indicator is large (e.g., Dynamic Island on iPhone 14+).

2. **Mobile nav FAB:** Already uses fixed positioning at `bottom: 1rem`. On standalone with home indicator, this would sit ~44px (home indicator height) above the actual safe area bottom. No padding set.

3. **Drawer height:** `max-h-[80vh]` assumes the viewport is the full screen minus toolbar. With home indicator visible (non-standalone), this is safe. With home indicator hidden (standalone, `viewport-fit=cover`), the drawer would extend under the home indicator area unless padded.

**No gaps if letterboxing is accepted.** One gap if standalone mode with `viewport-fit=cover` is the goal.

---

## 3. External-Link / New-Window Traps

Codebase search for `target="_blank"`, `window.open`, `rel="external"`, `data-sveltekit-reload`, and `href="http"`.

### Findings

**Only one external link in the codebase:**

**Source Link Component:** `src/lib/components/ui/source-link/source-link.svelte` (lines 13–21)
```svelte
<a
	{...rest}
	href={SOURCE_REPOSITORY_URL}
	target="_blank"
	rel="noopener noreferrer"
	class={cn('text-xs text-muted underline-offset-2 hover:underline', className)}
>
	{m.source_code_link()}
</a>
```

**URL:** `https://github.com/lj-n/genug-da` (from `src/lib/constants.ts`)

**Usage locations:**
1. `src/routes/(app)/navigation.svelte` (line 114): `<SourceLink />` at bottom of sidebar nav
2. `src/routes/(app)/navigation-mobile.svelte` (line 205): `<SourceLink />` at bottom of drawer nav
3. `src/routes/login/+page.svelte` (line 50): `<SourceLink class="mx-auto mt-6 block w-fit" />` below login form
4. `src/routes/login/first/+page.svelte` (line 84): `<SourceLink class="mx-auto mt-6 block w-fit" />` below registration form

**Markup:** All instances use the same component with `target="_blank"` + `rel="noopener noreferrer"`.

### iOS Standalone Behavior

In standalone mode (`display: standalone`), links with `target="_blank"` behave differently across browsers:
- **Safari iOS (14+):** Opens in a new in-app browser sheet (does not leave the app)
- **Chrome/Edge Android:** Typically opens an in-app browser sheet or PWA window
- **Desktop Safari:** Opens in a new tab (breaks standalone seamlessness)

**Current markup:** `target="_blank"` + `rel="noopener noreferrer"` is the standard safe choice for external links in PWAs. `noopener` prevents the external site from accessing `window.opener`, and `noreferrer` blocks the Referer header. This is best practice.

**No trap condition:** The link does not use `target="_self"` (which would break the link entirely in standalone), nor does it lack a target (which would navigate the app URL bar away). It explicitly opens externally.

### Assessment

**Finding:** One external link (GitHub source repository) is marked up correctly for standalone mode. iOS will open it in a bottom sheet without leaving the app. No security or UX trap.

**Gaps:** None. The markup is already standalone-safe.

---

## Gaps

1. **Viewport-fit not configured for safe-area layout support**
   - `src/app.html` line 7 lacks `viewport-fit=cover`. Currently letterboxed; if standalone support requires covering the notch, fixed elements (mobile nav FAB at `bottom-4 right-4`, drawer at `max-h-[80vh]`) need `env(safe-area-inset-*)` padding. No current gap if letterboxing is acceptable; gap exists if full-screen standalone is the goal.

2. **Mobile navigation FAB and drawer may overlap home indicator in standalone mode**
   - `src/routes/(app)/navigation-mobile.svelte` line 57: FAB uses `fixed right-4 bottom-4` with no safe-area padding. Drawer uses `max-h-[80vh]` from `src/lib/components/ui/drawer/drawer-content.svelte` line 28. With `viewport-fit=cover`, both would need `padding-bottom: env(safe-area-inset-bottom)` to inset from the home indicator.
