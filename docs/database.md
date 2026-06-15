# Database

SQLite via `better-sqlite3`, schema managed with Drizzle ORM. Tables are defined in `src/lib/server/db/tables/`, relations in `src/lib/server/db/relations.ts`.

Generate migrations: `npm run db:migrations` (requires `DATABASE_URL`).
Drizzle config: `drizzle.config.ts`.

## Tables

### `users`

`src/lib/server/db/tables/users.ts`

| Column         | Type      | Notes                                          |
| -------------- | --------- | ---------------------------------------------- |
| `id`           | text PK   | auto-generated via `createId()`                |
| `username`     | text      | unique                                         |
| `passwordHash` | text      | Argon2 hash                                    |
| `isAdmin`      | boolean   | max one admin enforced by partial unique index |
| `createdAt`    | timestamp |                                                |

### `sessions`

Same file as users.

| Column      | Type            | Notes                  |
| ----------- | --------------- | ---------------------- |
| `id`        | text PK         |                        |
| `userId`    | text FK → users | cascade delete         |
| `expiresAt` | timestamp       | default: now + 20 days |

### `budgets`

`src/lib/server/db/tables/budgets.ts`

| Column      | Type      | Notes                     |
| ----------- | --------- | ------------------------- |
| `id`        | text PK   | auto-generated            |
| `name`      | text      |                           |
| `currency`  | text enum | `CURRENCIES` (e.g. `EUR`) |
| `createdAt` | timestamp |                           |

### `usersToBudgets`

Many-to-many join with role. Composite PK on `(userId, budgetId)`.

| Column     | Type         | Notes                            |
| ---------- | ------------ | -------------------------------- |
| `userId`   | FK → users   | cascade delete                   |
| `budgetId` | FK → budgets | cascade delete                   |
| `role`     | enum         | `OWNER` \| `MEMBER` \| `INVITEE` |

`INVITEE` means pending invite — not yet a full member. `userHasPermission()` filters `role !== 'INVITEE'`.

### `accounts`

`src/lib/server/db/tables/accounts.ts`

| Column       | Type         | Notes                  |
| ------------ | ------------ | ---------------------- |
| `id`         | text PK      |                        |
| `budgetId`   | FK → budgets | cascade delete         |
| `name`       | text         | unique per budget      |
| `notes`      | text         | nullable               |
| `archivedAt` | timestamp    | nullable — soft delete |
| `createdAt`  | timestamp    |                        |

### `categories`

`src/lib/server/db/tables/categories.ts`

| Column          | Type            | Notes                                    |
| --------------- | --------------- | ---------------------------------------- |
| `id`            | text PK         |                                          |
| `budgetId`      | FK → budgets    | cascade delete                           |
| `name`          | text            | unique per budget                        |
| `notes`         | text            | nullable                                 |
| `targetBalance` | integer (cents) | nullable, must be > 0 (check constraint) |
| `archivedAt`    | timestamp       | nullable — soft delete                   |
| `createdAt`     | timestamp       |                                          |

### `transactions`

`src/lib/server/db/tables/transactions.ts`

| Column       | Type            | Notes                                                           |
| ------------ | --------------- | --------------------------------------------------------------- |
| `id`         | text PK         |                                                                 |
| `budgetId`   | FK → budgets    | cascade delete                                                  |
| `accountId`  | FK → accounts   | cascade delete; composite FK also checks `budgetId` matches     |
| `categoryId` | FK → categories | set null on delete; composite FK also checks `budgetId` matches |
| `amount`     | integer (cents) |                                                                 |
| `date`       | text            | `YYYY-MM-DD`, enforced by check constraint                      |
| `notes`      | text            | nullable                                                        |
| `validated`  | boolean         | default false                                                   |
| `createdBy`  | FK → users      | set null on delete                                              |
| `createdAt`  | timestamp       |                                                                 |

The composite FKs on `(accountId, budgetId)` and `(categoryId, budgetId)` prevent cross-budget references at the DB level.

### `budgetAssignments`

Monthly budget allocations per category. Composite PK on `(categoryId, month)`.

| Column       | Type            | Notes                                                                    |
| ------------ | --------------- | ------------------------------------------------------------------------ |
| `categoryId` | FK → categories | cascade delete                                                           |
| `budgetId`   | FK → budgets    | cascade delete                                                           |
| `month`      | integer         | `YYYYMM` format, range 190001–210012, month part 01–12 enforced by check |
| `amount`     | integer (cents) |                                                                          |

### `userEntityOrder`

Per-user custom sort order for budgets, accounts, and categories. Composite PK on `(userId, entityType, entityId)`.

| Column       | Type       | Notes                               |
| ------------ | ---------- | ----------------------------------- |
| `userId`     | FK → users | cascade delete                      |
| `entityType` | enum       | `budget` \| `account` \| `category` |
| `entityId`   | text       | ID of the ordered entity            |
| `position`   | integer    | sort position                       |

## ID generation

`src/lib/server/utils/create-id.ts` — uses `@oslojs/crypto` random bytes, 12 chars by default. All PKs use this via `$defaultFn(() => createId())`.
