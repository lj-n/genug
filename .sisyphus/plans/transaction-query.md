# Transaction List Query

## TL;DR

> **Quick Summary**: Create a generic, reusable `list` method in a new `transaction.ts` action file that fetches transactions for an account with pagination, sorting, and filtering — following the existing `createXActions` pattern.
>
> **Deliverables**:
>
> - `src/lib/server/db/actions/transaction.ts` — new action file with `createTransactionActions`
> - Updated `src/lib/server/db/actions/index.ts` — register transaction actions in the `Actions` class
> - Updated `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.server.ts` — call `actions.transaction.list()` in the load function
>
> **Estimated Effort**: Quick
> **Parallel Execution**: NO — sequential (3 tasks, each depends on previous)
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request

User wants to fetch all transactions belonging to an account on the account detail page, with support for pagination, sorting, and filtering to be passed as arguments for reusability.

### Interview Summary

**Key Discussions**:

- **Return shape**: Left join categories AND users (createdBy) to include display names
- **Pagination**: Offset/limit style
- **Sort columns**: Predefined set (`date`, `amount`, `validated`, `createdAt`)
- **Filters**: Date range, categoryId, validated status, notes LIKE search, amount min/max
- **Style**: Follow existing `createXActions` pattern exactly

### Metis Review

**Identified Gaps** (addressed):

- LIKE wildcard escaping for notes search → Escape `%` and `_` before building pattern
- Sort stability → Append tiebreaker columns (`id ASC`) after user-specified sort
- Total count for pagination → Separate COUNT query with same filters
- No index on categoryId/validated → Accepted limitation, document
- `accountId` always required → Confirmed by route structure

---

## Work Objectives

### Core Objective

Build a single, reusable `list` method that retrieves paginated, sorted, filtered transactions for an account — with joined category name and creator name.

### Concrete Deliverables

- New file: `src/lib/server/db/actions/transaction.ts`
- Modified file: `src/lib/server/db/actions/index.ts`
- Modified file: `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.server.ts`

### Definition of Done

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `lsp_diagnostics` clean on all modified files
- [ ] Transaction list loads on account detail page

### Must Have

- `accountId` is always a required parameter
- Permission check via `userHasPermission` on `transactions.budgetId`
- All filter params are optional (omitting = no filter applied)
- Returns `{ data: TransactionRow[], total: number }`
- Joined `categoryName` (nullable — null when no category)
- Joined `createdByName` (nullable — null when user deleted)
- Sort direction: `asc` | `desc`
- Default sort: `date DESC` when no sort specified
- Tiebreaker: always append `id ASC` for stable ordering
- Escape `%` and `_` in notes search term
- Default limit: `50`, default offset: `0`
- Date range is inclusive both ends (`from <= date <= to`)
- Amount filter applies to signed value (not absolute)

### Must NOT Have (Guardrails)

- NO `create`, `update`, `delete` methods — read-only `list` only
- NO generic query builder abstraction — one specific function
- NO computed columns (running balance, subtotals, category color)
- NO sorting by joined columns (category name, user name)
- NO full-text search — simple `LIKE '%term%'` only
- NO response transformation or formatting (return raw DB types)
- NO cursor-based pagination
- NO index migrations or schema changes
- NO async/await — synchronous better-sqlite3

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision

- **Infrastructure exists**: YES (vitest via bun)
- **Automated tests**: None for this task (no existing action-level test pattern)
- **Framework**: vitest (via `import.meta.vitest` inline or standalone `.test.ts`)

### QA Policy

Every task includes agent-executed verification via `tsc --noEmit` and LSP diagnostics.

---

## Execution Strategy

### Sequential Execution

```
Task 1: Create transaction.ts action file [quick]
Task 2: Register in Actions class (depends: 1) [quick]
Task 3: Use in page.server.ts load function (depends: 2) [quick]

Critical Path: Task 1 → Task 2 → Task 3
```

### Dependency Matrix

| Task | Depends On | Blocks |
| ---- | ---------- | ------ |
| 1    | —          | 2, 3   |
| 2    | 1          | 3      |
| 3    | 1, 2       | —      |

### Agent Dispatch Summary

- **Wave 1**: 3 sequential tasks, all `quick` category

---

## TODOs

- [x] 1. Create `createTransactionActions` in new file

  **What to do**:
  - Create `src/lib/server/db/actions/transaction.ts`
  - Export `createTransactionActions({ database, user })` following the factory pattern
  - Implement a single `list` method with this signature:
    ```typescript
    list({ accountId, pagination, sort, filters }: {
      accountId: string;
      pagination?: { limit?: number; offset?: number };
      sort?: { column: 'date' | 'amount' | 'validated' | 'createdAt'; direction: 'asc' | 'desc' };
      filters?: {
        dateFrom?: string;     // 'YYYY-MM-DD', inclusive
        dateTo?: string;       // 'YYYY-MM-DD', inclusive
        categoryId?: string;   // specific category, or null for uncategorized
        validated?: boolean;
        notes?: string;        // LIKE '%escaped_term%'
        amountMin?: number;    // signed value, inclusive
        amountMax?: number;    // signed value, inclusive
      };
    })
    ```
  - Return type: `{ data: Row[], total: number }`
  - Build WHERE clause: always include `eq(transactions.accountId, accountId)` AND `userHasPermission({budgetIdCol: transactions.budgetId, ...})`
  - Conditionally add filter conditions (only when param is provided)
  - For notes filter: escape `%` and `_` chars before wrapping in `%term%`
  - Left join `categories` on `transactions.categoryId = categories.id` → select `categories.name` as `categoryName`
  - Left join `users` on `transactions.createdBy = users.id` → select `users.name` as `createdByName`
  - Use `getColumns(tables.transactions)` spread + the two joined name columns
  - Apply sort: map column string to actual table column, apply direction
  - Always append `.id ASC` as tiebreaker after primary sort
  - Default sort when none provided: `date DESC, id ASC`
  - Apply pagination: `.limit(limit ?? 50).offset(offset ?? 0)`
  - Separate COUNT query with same WHERE clause (no joins needed for count) for `total`
  - Use `sql<number>` for count result typing

  **Must NOT do**:
  - No async/await — keep synchronous
  - No generic query builder — hardcode the query logic
  - No mutation methods
  - No sorting by joined columns

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation following a well-established pattern with clear examples
  - **Skills**: []
    - No special skills needed — standard Drizzle ORM query building

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (first)
  - **Blocks**: Tasks 2, 3
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/lib/server/db/actions/account.ts:6-127` — Factory pattern structure (`createAccountActions`), `userHasPermission` usage in WHERE, import style
  - `src/lib/server/db/actions/category.ts:149-165` — Transaction query pattern with `getColumns(tables.transactions)` and permission check
  - `src/lib/server/db/actions/budget.ts:17-40` — Left join pattern with `leftJoin` + `and(eq(...), eq(...))` conditions

  **API/Type References** (contracts to implement against):
  - `src/lib/server/db/tables/transactions.ts:10-54` — Full transaction table schema (all columns, their types, nullable fields)
  - `src/lib/server/db/tables/categories.ts:7-35` — Categories table (need `name` column for join)
  - `src/lib/server/db/actions/permissions.ts:13-33` — `userHasPermission` function signature and usage

  **External References**:
  - Drizzle ORM docs: `eq`, `and`, `asc`, `desc`, `like`, `gte`, `lte`, `sql`, `getColumns` from `drizzle-orm`

  **WHY Each Reference Matters**:
  - `account.ts` shows the exact factory structure to replicate (imports, function signature, return object)
  - `category.ts:149-165` shows how to query transactions with permission checks
  - `budget.ts:17-40` shows how left joins are structured with multi-condition ON clauses
  - `transactions.ts` schema is needed to know column names, types, and nullability
  - `permissions.ts` shows the exact function signature for `userHasPermission`

  **Acceptance Criteria**:
  - [ ] File exists: `src/lib/server/db/actions/transaction.ts`
  - [ ] Exports `createTransactionActions` function
  - [ ] `tsc --noEmit` passes
  - [ ] `lsp_diagnostics` on file shows zero errors

  **QA Scenarios:**

  ```
  Scenario: TypeScript compilation passes
    Tool: Bash
    Preconditions: File created at src/lib/server/db/actions/transaction.ts
    Steps:
      1. Run: npx tsc --noEmit
      2. Assert: exit code 0, no errors mentioning transaction.ts
    Expected Result: Clean compilation with zero type errors
    Failure Indicators: Any error output referencing transaction.ts
    Evidence: .sisyphus/evidence/task-1-tsc-check.txt

  Scenario: LSP reports no diagnostics
    Tool: lsp_diagnostics
    Preconditions: File created
    Steps:
      1. Run lsp_diagnostics on src/lib/server/db/actions/transaction.ts with severity "error"
      2. Assert: zero diagnostics returned
    Expected Result: Empty diagnostics array
    Failure Indicators: Any error-level diagnostic
    Evidence: .sisyphus/evidence/task-1-lsp-diagnostics.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add transaction list query with pagination, sort and filters`
  - Files: `src/lib/server/db/actions/transaction.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 2. Register in Actions class

  **What to do**:
  - Import `createTransactionActions` in `src/lib/server/db/actions/index.ts`
  - Add `transaction` property to `Actions` class with type `ReturnType<typeof import('./transaction').createTransactionActions>`
  - Initialize in constructor: `this.transaction = createTransactionActions({ database, user })`

  **Must NOT do**:
  - Don't change any existing action registrations
  - Don't modify the constructor signature

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3-line addition to an existing file following an exact pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (second)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/lib/server/db/actions/index.ts:1-17` — Exact pattern to follow: import at top, type declaration in class, initialization in constructor

  **WHY Each Reference Matters**:
  - `index.ts` is the ONLY file being modified — shows exact import style, type annotation pattern (`ReturnType<typeof import('./X').createXActions>`), and constructor initialization order

  **Acceptance Criteria**:
  - [ ] `Actions` class has `transaction` property
  - [ ] `tsc --noEmit` passes
  - [ ] `lsp_diagnostics` on index.ts shows zero errors

  **QA Scenarios:**

  ```
  Scenario: Actions class exposes transaction property
    Tool: Bash
    Preconditions: Task 1 complete, index.ts modified
    Steps:
      1. Run: npx tsc --noEmit
      2. Assert: exit code 0
    Expected Result: TypeScript accepts the new property and its type
    Failure Indicators: Type error about missing property or incompatible types
    Evidence: .sisyphus/evidence/task-2-tsc-check.txt
  ```

  **Commit**: NO (groups with Task 3)

- [x] 3. Use in page.server.ts load function

  **What to do**:
  - In `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.server.ts`:
  - After the account existence check, call `actions.transaction.list({ accountId: account.id })`
  - Pass default pagination (no sort/filter for now — those will come from URL search params later)
  - Return `transactions` (the `data` array) and `transactionCount` (the `total`) alongside the existing `account` return

  **Must NOT do**:
  - Don't parse URL search params yet (pagination/sort/filter from URL is a future task)
  - Don't change the existing account lookup logic
  - Don't add error handling for the transaction query (empty result is valid)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3-4 lines added to an existing load function
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (third)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.server.ts:1-16` — Current load function to modify
  - `src/lib/server/db/actions/permissions.ts:35-57` — How `withPermissions` provides `actions` parameter

  **WHY Each Reference Matters**:
  - The page.server.ts shows the exact structure being modified (withPermissions wrapper, parent() call, account lookup)
  - permissions.ts confirms `actions` is a full `Actions` instance with access to `actions.transaction`

  **Acceptance Criteria**:
  - [ ] Load function returns `transactions` and `transactionCount`
  - [ ] `tsc --noEmit` passes
  - [ ] `lsp_diagnostics` on page.server.ts shows zero errors

  **QA Scenarios:**

  ```
  Scenario: Page loads without errors
    Tool: Bash
    Preconditions: Tasks 1 and 2 complete, page.server.ts modified
    Steps:
      1. Run: npx tsc --noEmit
      2. Assert: exit code 0, no errors in any file
    Expected Result: Full project type-checks cleanly
    Failure Indicators: Any type error in page.server.ts or related files
    Evidence: .sisyphus/evidence/task-3-tsc-check.txt

  Scenario: Dev server starts without error
    Tool: Bash
    Preconditions: All files saved
    Steps:
      1. Run: timeout 10 npx vite build 2>&1 || true
      2. Assert: no "error" in output (warnings are acceptable)
    Expected Result: Vite build succeeds or only shows warnings
    Failure Indicators: Build error mentioning transaction or page.server
    Evidence: .sisyphus/evidence/task-3-build-check.txt
  ```

  **Commit**: YES (includes Task 2 changes)
  - Message: `feat(accounts): wire transaction list into account detail page`
  - Files: `src/lib/server/db/actions/index.ts`, `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.server.ts`
  - Pre-commit: `npx tsc --noEmit`

---

## Final Verification Wave

> After all 3 tasks complete, run a final type check across the project.

- [x] F1. **Type Safety Verification** — Run `npx tsc --noEmit` and confirm zero errors project-wide
- [x] F2. **Build Verification** — Run `npx vite build` and confirm successful build

---

## Commit Strategy

| #   | Message                                                                  | Files                                                                                                          | Verification       |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | `feat(db): add transaction list query with pagination, sort and filters` | `src/lib/server/db/actions/transaction.ts`                                                                     | `npx tsc --noEmit` |
| 2   | `feat(accounts): wire transaction list into account detail page`         | `src/lib/server/db/actions/index.ts`, `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/+page.server.ts` | `npx tsc --noEmit` |

---

## Success Criteria

### Verification Commands

```bash
npx tsc --noEmit          # Expected: exit 0, no errors
npx vite build            # Expected: successful build
```

### Final Checklist

- [ ] `createTransactionActions` exported from `transaction.ts`
- [ ] `list` method accepts accountId + optional pagination/sort/filters
- [ ] Returns `{ data, total }` with joined category name and creator name
- [ ] Registered in `Actions` class
- [ ] Used in account page load function
- [ ] All "Must NOT Have" guardrails respected
