# Transaction Pages i18n

## TL;DR

> **Quick Summary**: Add paraglide-js translations (EN + DE) for all hardcoded strings in the transaction table pages.
>
> **Deliverables**:
>
> - 9 new message keys in `messages/en.json` and `messages/de.json`
> - 3 source files updated to use `m.*()` translation calls
>
> **Estimated Effort**: Quick
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 (messages) → Tasks 2-4 (source files, parallel)

---

## Context

### Original Request

Add paraglide-js translations for all hardcoded strings in the transaction table pages at `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/`.

### Interview Summary

**Key Discussions**:

- Pagination items use a single parameterized key `"{count} per page"` (not separate keys per option)
- Follow existing pattern: `import { m } from '$lib/paraglide/messages'`

**Research Findings**:

- Base locale is `"de"` (German), English is secondary — but both message files are authored in sync
- Page-reload model for locale switching → module-level `m.*()` calls in `.ts` files are safe (no reactive wrappers needed)
- `FlexRender` renders string returns from `header: m.key()` correctly (same as current `header: 'Category'`)
- Existing key naming pattern: `budget_monthly_table_header_*` → new prefix: `transactions_*`

### Metis Review

**Identified Gaps** (addressed):

- Confirmed module-level `m.*()` is safe due to page-reload architecture
- Confirmed `Select.Item` values stay as numbers, only display text translated
- Pagination.PrevButton/NextButton are library components (handle own i18n) — out of scope

---

## Work Objectives

### Core Objective

Replace all 10 hardcoded English strings in the transaction table with paraglide-js message function calls, providing both EN and DE translations.

### Concrete Deliverables

- `messages/en.json`: 8 new translation keys added
- `messages/de.json`: 8 new translation keys added
- `transaction-table-columns.ts`: column headers + aria-label use `m.*()`
- `table-pagination.svelte`: all display strings use `m.*()`
- `table-cell-category.svelte`: fallback text uses `m.*()`

### Definition of Done

- [ ] `npm run build` exits with code 0
- [ ] `npm run check` exits with code 0
- [ ] Zero hardcoded English strings remain in the 3 target source files
- [ ] Both `en.json` and `de.json` contain all 9 new keys

### Must Have

- All 10 hardcoded strings translated in both languages
- Parameterized messages for dynamic content (pagination info, per-page count)
- Consistent key naming with `transactions_` prefix

### Must NOT Have (Guardrails)

- DO NOT convert `columns` array to a function/factory pattern
- DO NOT add `$derived` or reactive wrappers in the `.ts` file
- DO NOT translate dynamic data (account names, category names, amounts, dates)
- DO NOT touch files other than the 3 source files + 2 message files
- DO NOT change `Select.Item` value attributes (only display text)
- DO NOT add a language switcher or locale infrastructure changes

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed.

### Test Decision

- **Infrastructure exists**: YES (vitest)
- **Automated tests**: NO (i18n string replacement verifiable via build + grep)
- **Framework**: N/A

### QA Policy

Every task verified via build commands and grep assertions.
Evidence saved to `.sisyphus/evidence/task-{N}-*.txt`.

- **Build verification**: `npm run build` and `npm run check`
- **String presence**: grep new message keys in both JSON files
- **String absence**: grep for original hardcoded strings in source files

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — message files):
└── Task 1: Add all translation keys to en.json and de.json [quick]

Wave 2 (Source files — MAX PARALLEL, all depend on Task 1):
├── Task 2: Update transaction-table-columns.ts [quick]
├── Task 3: Update table-pagination.svelte [quick]
└── Task 4: Update table-cell-category.svelte [quick]

Wave FINAL (Verification):
└── Task F1: Build + grep verification [quick]
```

### Dependency Matrix

| Task | Depends On | Blocks  |
| ---- | ---------- | ------- |
| 1    | —          | 2, 3, 4 |
| 2    | 1          | F1      |
| 3    | 1          | F1      |
| 4    | 1          | F1      |
| F1   | 2, 3, 4    | —       |

### Agent Dispatch Summary

- **Wave 1**: 1 task → `quick`
- **Wave 2**: 3 tasks → `quick` (parallel)
- **Final**: 1 task → `quick`

---

## TODOs

- [x] 1. Add translation keys to message files

  **What to do**:
  - Add the following 8 keys to `messages/en.json` (before the closing `}`):
    ```json
    "transactions_table_header_category": "Category",
    "transactions_table_header_notes": "Notes",
    "transactions_table_header_date": "Date",
    "transactions_table_header_amount": "Amount",
    "transactions_table_select_all": "Select all",
    "transactions_table_without_category": "Without Category",
    "transactions_pagination_per_page": "{count} per page",
    "transactions_pagination_showing": "Showing {start} - {end} of {total}",
    "transactions_pagination_page_size_label": "How many transactions should be displayed per page?"
    ```
  - Add the following 9 keys to `messages/de.json` (before the closing `}`):
    ```json
    "transactions_table_header_category": "Kategorie",
    "transactions_table_header_notes": "Notizen",
    "transactions_table_header_date": "Datum",
    "transactions_table_header_amount": "Betrag",
    "transactions_table_select_all": "Alle auswählen",
    "transactions_table_without_category": "Ohne Kategorie",
    "transactions_pagination_per_page": "{count} pro Seite",
    "transactions_pagination_showing": "{start} - {end} von {total}",
    "transactions_pagination_page_size_label": "Wie viele Transaktionen sollen pro Seite angezeigt werden?"
    ```

  **Must NOT do**:
  - Do not reorder or reformat existing keys
  - Do not change the `$schema` field
  - Do not remove any existing keys

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation task)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `messages/en.json:5` — Parameterized message example: `"name_error_minlength": "The name must be at least {length} characters long."`
  - `messages/de.json:5` — German equivalent showing idiomatic translation

  **Acceptance Criteria**:

  ```
  Scenario: Message keys present in en.json
    Tool: Bash (grep)
    Steps:
      1. grep "transactions_table_header_category" messages/en.json
      2. grep "transactions_pagination_showing" messages/en.json
      3. grep "transactions_pagination_per_page" messages/en.json
    Expected Result: All 3 greps return matches (exit code 0)
    Evidence: .sisyphus/evidence/task-1-keys-en.txt

  Scenario: Message keys present in de.json
    Tool: Bash (grep)
    Steps:
      1. grep "transactions_table_header_category" messages/de.json
      2. grep "transactions_pagination_showing" messages/de.json
      3. grep "transactions_pagination_per_page" messages/de.json
    Expected Result: All 3 greps return matches (exit code 0)
    Evidence: .sisyphus/evidence/task-1-keys-de.txt

  Scenario: JSON validity
    Tool: Bash
    Steps:
      1. node -e "JSON.parse(require('fs').readFileSync('messages/en.json', 'utf8'))"
      2. node -e "JSON.parse(require('fs').readFileSync('messages/de.json', 'utf8'))"
    Expected Result: Both commands exit with code 0 (valid JSON)
    Evidence: .sisyphus/evidence/task-1-json-valid.txt
  ```

  **Commit**: YES
  - Message: `i18n(transactions): add EN/DE translation keys for transaction table`
  - Files: `messages/en.json`, `messages/de.json`

---

- [x] 2. Update transaction-table-columns.ts with translation calls

  **What to do**:
  - Add import: `import { m } from '$lib/paraglide/messages';` at top (after existing imports)
  - Replace `'Select all'` (line 23) with `m.transactions_table_select_all()`
  - Replace `header: 'Category'` (line 34) with `header: m.transactions_table_header_category()`
  - Replace `header: 'Notes'` (line 40) with `header: m.transactions_table_header_notes()`
  - Replace `header: 'Date'` (line 46) with `header: m.transactions_table_header_date()`
  - Replace `header: 'Amount'` (line 52) with `header: m.transactions_table_header_amount()`

  **Must NOT do**:
  - Do not wrap `columns` in a function or make it reactive
  - Do not add `$derived` or store wrappers
  - Do not change cell renderers or column IDs
  - Do not change the `validated` column header (it's an icon component, not text)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: F1
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/transaction-table-columns.ts` — The file to modify (current column definitions)
  - `src/routes/login/+page.server.ts:2` — Import pattern: `import { m } from '$lib/paraglide/messages';`

  **API/Type References**:
  - Column header accepts `string | (() => ...)` — a plain `m.key()` call returning a string works

  **Acceptance Criteria**:

  ```
  Scenario: No hardcoded English headers remain
    Tool: Bash (grep)
    Steps:
      1. grep -n "header: 'Category'" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
      2. grep -n "header: 'Notes'" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
      3. grep -n "header: 'Date'" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
      4. grep -n "header: 'Amount'" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
      5. grep -n "'Select all'" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
    Expected Result: All 5 greps return NO matches (exit code 1)
    Evidence: .sisyphus/evidence/task-2-no-hardcoded.txt

  Scenario: Translation calls present
    Tool: Bash (grep)
    Steps:
      1. grep "m.transactions_table_header_category" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
      2. grep "m.transactions_table_select_all" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/transaction-table-columns.ts
    Expected Result: Both greps return matches (exit code 0)
    Evidence: .sisyphus/evidence/task-2-translations-present.txt
  ```

  **Commit**: YES
  - Message: `i18n(transactions): translate column headers in transaction table`
  - Files: `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/transaction-table-columns.ts`

---

- [x] 3. Update table-pagination.svelte with translation calls

  **What to do**:
  - Add import: `import { m } from '$lib/paraglide/messages';` in the `<script>` tag
  - Replace the `pagesInfo` derived computation (line 38-43):
    ```typescript
    let pagesInfo: string = $derived.by(() => {
    	const currentPage = Math.min(page, pageCount);
    	const start = pageTotalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    	const end = pageTotalCount === 0 ? 0 : Math.min(start + pageSize - 1, pageTotalCount);
    	return m.transactions_pagination_showing({
    		start: String(start),
    		end: String(end),
    		total: String(pageTotalCount)
    	});
    });
    ```
  - Replace `aria-label="How many transactions should be displayed per page?"` (line 60) with `aria-label={m.transactions_pagination_page_size_label()}`
  - Replace Select trigger text `{pageSize} per page` (line 62) with `{m.transactions_pagination_per_page({ count: String(pageSize) })}`
  - Replace all 5 `Select.Item` display texts (lines 65-69):
    - `<Select.Item value="15">{m.transactions_pagination_per_page({ count: "15" })}</Select.Item>`
    - `<Select.Item value="25">{m.transactions_pagination_per_page({ count: "25" })}</Select.Item>`
    - `<Select.Item value="50">{m.transactions_pagination_per_page({ count: "50" })}</Select.Item>`
    - `<Select.Item value="75">{m.transactions_pagination_per_page({ count: "75" })}</Select.Item>`
    - `<Select.Item value="100">{m.transactions_pagination_per_page({ count: "100" })}</Select.Item>`

  **Must NOT do**:
  - Do not change `Select.Item` `value` attributes (keep `"15"`, `"25"`, etc.)
  - Do not change pagination logic or navigation
  - Do not modify the `setPaginationQueryParam` function
  - Do not change the Pagination.Root component or its bindings

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 4)
  - **Blocks**: F1
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/table-pagination.svelte` — The file to modify
  - `src/routes/login/+page.svelte:5` — Import pattern in svelte files: `import { m } from '$lib/paraglide/messages';`
  - `src/routes/login/+page.svelte:21` — Usage with parameters in derived: `m.login_admin_button()`
  - `messages/en.json:5` — Parameterized messages use `{paramName}` syntax

  **Acceptance Criteria**:

  ```
  Scenario: No hardcoded English strings remain
    Tool: Bash (grep)
    Steps:
      1. grep -n "per page" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-pagination.svelte
      2. grep -n "Showing" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-pagination.svelte
      3. grep -n "How many transactions" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-pagination.svelte
    Expected Result: grep 1 finds only m.transactions_pagination_per_page calls (not bare "per page" text). greps 2 and 3 return NO matches (exit code 1).
    Evidence: .sisyphus/evidence/task-3-no-hardcoded.txt

  Scenario: Translation calls present
    Tool: Bash (grep)
    Steps:
      1. grep "m.transactions_pagination_showing" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-pagination.svelte
      2. grep "m.transactions_pagination_per_page" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-pagination.svelte
      3. grep "m.transactions_pagination_page_size_label" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-pagination.svelte
    Expected Result: All 3 greps return matches (exit code 0)
    Evidence: .sisyphus/evidence/task-3-translations-present.txt
  ```

  **Commit**: YES
  - Message: `i18n(transactions): translate pagination strings`
  - Files: `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/table-pagination.svelte`

---

- [x] 4. Update table-cell-category.svelte with translation call

  **What to do**:
  - Add `<script>` import: `import { m } from '$lib/paraglide/messages';`
  - Replace `Without Category` (line 9) with `{m.transactions_table_without_category()}`

  **Must NOT do**:
  - Do not change the component structure or styling
  - Do not translate the dynamic `categoryName` prop

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3)
  - **Blocks**: F1
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/table-cell-category.svelte` — The file to modify
  - `src/routes/login/+page.svelte:5` — Import pattern

  **Acceptance Criteria**:

  ```
  Scenario: No hardcoded "Without Category" remains
    Tool: Bash (grep)
    Steps:
      1. grep -n "Without Category" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-cell-category.svelte
    Expected Result: No matches (exit code 1)
    Evidence: .sisyphus/evidence/task-4-no-hardcoded.txt

  Scenario: Translation call present
    Tool: Bash (grep)
    Steps:
      1. grep "m.transactions_table_without_category" src/routes/\(app\)/\[budgetId=id\]/accounts/\[accountId=id\]/table-cell-category.svelte
    Expected Result: Match found (exit code 0)
    Evidence: .sisyphus/evidence/task-4-translation-present.txt
  ```

  **Commit**: YES
  - Message: `i18n(transactions): translate "Without Category" fallback`
  - Files: `src/routes/(app)/[budgetId=id]/accounts/[accountId=id]/table-cell-category.svelte`

---

## Final Verification Wave

- [x] F1. **Build and completeness verification** — `quick`

  Run full build and type checking. Verify no hardcoded English text remains in target files. Verify key parity between en.json and de.json.

  ```
  Scenario: Full build passes
    Tool: Bash
    Steps:
      1. npm run build
      2. npm run check
    Expected Result: Both exit with code 0
    Evidence: .sisyphus/evidence/final-build.txt

  Scenario: Key parity between en.json and de.json
    Tool: Bash
    Steps:
      1. For each new key (transactions_table_header_category, transactions_table_header_notes, transactions_table_header_date, transactions_table_header_amount, transactions_table_select_all, transactions_table_without_category, transactions_pagination_per_page, transactions_pagination_showing, transactions_pagination_page_size_label): grep in both files
    Expected Result: All keys present in both files
    Evidence: .sisyphus/evidence/final-key-parity.txt
  ```

---

## Commit Strategy

| Order | Message                                                                | Files                                  |
| ----- | ---------------------------------------------------------------------- | -------------------------------------- |
| 1     | `i18n(transactions): add EN/DE translation keys for transaction table` | `messages/en.json`, `messages/de.json` |
| 2     | `i18n(transactions): translate column headers in transaction table`    | `transaction-table-columns.ts`         |
| 3     | `i18n(transactions): translate pagination strings`                     | `table-pagination.svelte`              |
| 4     | `i18n(transactions): translate "Without Category" fallback`            | `table-cell-category.svelte`           |

---

## Success Criteria

### Verification Commands

```bash
npm run build   # Expected: exit 0
npm run check   # Expected: exit 0
```

### Final Checklist

- [ ] All 10 hardcoded English strings replaced with `m.*()` calls
- [ ] 9 keys present in `messages/en.json`
- [ ] 9 keys present in `messages/de.json` (with idiomatic German)
- [ ] No `$derived` wrappers or reactive patterns added to `.ts` file
- [ ] `Select.Item` values unchanged (only display text translated)
- [ ] Build passes, no TypeScript errors
