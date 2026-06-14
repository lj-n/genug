# Playwright E2E Testing

E2E tests for genug-da are located in `tests/playwright/` and use **Playwright Test** with **Page Object Models (POM)**.

## Setup

- Playwright config: `playwright.config.ts`
- Test files: `tests/playwright/**/*.spec.ts`
- Page objects: `tests/playwright/pom/`
- Global setup: `tests/playwright/global.setup.ts`

## Running tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run a specific test file
npx playwright test tests/playwright/auth.spec.ts

# Run with trace enabled
npx playwright test --trace on
```

Results are gitignored at `tests/playwright/results/`.

## Page Object Models

Located in `tests/playwright/pom/`. Each POM class extends `BasePage`.

### BasePage (`base-page.ts`)

```typescript
class BasePage {
	// Viewport detection (readonly computed):
	get isDesktop()  // viewport >= 1292px
	get isMobile()   // viewport <= 767px
	get isTablet()   // between desktop and mobile

	// Mobile navigation:
	async openMobileNavigation()     // opens nav toggle
	async closeMobileNavigation()    // closes it if visible

	// Budget creation (navigates to /new):
	async createBudget(name: string)
}
```

### BudgetPage (`budget.ts`)

```typescript
class BudgetPage extends BasePage {
	// Navigate to a budget via sidebar link:
	async goto(budgetName: string)

	// Create an account via AccountDropdown dialog:
	async createAccount(name: string, startingBalance = '0')
}
```

### AccountPage (`account.ts`)

```typescript
class AccountPage extends BasePage {
	// Navigate to an account via sidebar link:
	async goto(accountName: string)

	// Change account name via Settings dialog:
	async editName(name: string)
}
```

## Viewport handling

POM methods automatically handle responsive navigation:
- On **mobile/tablet** viewports: `goto()` opens the mobile navigation before clicking links.
- On **desktop**: sidebar is always visible, no navigation toggle needed.

Breakpoints:
| Viewport | Width |
|----------|-------|
| Mobile   | ≤ 767px |
| Tablet   | 768–1291px |
| Desktop  | ≥ 1292px |

## Auth flow

Tests use a two-phase serial setup in `global.setup.ts`:

1. **Test 1 (serial):** Navigate to `/login/first` (expect 404 if admin exists), log in as existing admin, reset DB via "Reset Instance" button, create a fresh admin, sign out, re-login.
2. **Subsequent tests:** Use helper functions like `createUserAndLogin()` to set up auth per test.

No `storageState` is saved — every test handles its own authentication. This keeps tests self-contained and avoids stale session state.

## POM index

`tests/playwright/pom/index.ts` wraps all POM instances:

```typescript
export function createPages(page: Page) {
	return {
		account: new AccountPage(page),
		budget: new BudgetPage(page),
	};
}
```

## Conventions

- Use `aria-label` selectors (`getByRole`, `getByLabel`) over CSS selectors — they're stable across UI changes.
- Use POM methods for all page interactions — don't inline `page.getByRole(...)` directly in test files.
- Prefer exact string matching (`name: 'Create Budget'`) over regex — avoid false positives.
- Each test file starts with a clean DB state or resets to known state.
- Viewport is set per file in `playwright.config.ts` or via `test.use()`.
