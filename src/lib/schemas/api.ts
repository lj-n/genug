import { MoneySchema } from '$lib/utils/money';
import * as v from 'valibot';

import { BudgetMonthSchema } from './budget';

/**
 * API-only valibot schemas for the additive HTTP API (map #190).
 *
 * The web transfer forms (`src/lib/schemas/transaction.ts`) are
 * register-relative — a signed `amount` from the viewed account plus a
 * `counterpartAccountId`. Native clients speak the domain's from/to shape
 * directly (ADR-0015), so these mirror the `transfer` / `editTransfer`
 * commands and stay API-only. Likewise the web reassignment routes the
 * "back to Unassigned" case through a sentinel; the API expresses it as a
 * nullable `targetCategoryId`.
 *
 * These are the request-body source of truth: the OpenAPI contract derives
 * their shapes via `@valibot/to-json-schema` (#194) and #195 validates
 * incoming requests against them.
 */

const PositiveAmount = v.pipe(
	MoneySchema,
	v.check((value) => value > 0, 'Amount must be positive')
);

export const ApiTransferCreateSchema = v.object({
	amount: PositiveAmount,
	budgetId: v.pipe(v.string(), v.minLength(1)),
	date: v.optional(v.pipe(v.string(), v.minLength(1))),
	fromAccountId: v.pipe(v.string(), v.minLength(1)),
	notes: v.optional(v.string()),
	toAccountId: v.pipe(v.string(), v.minLength(1))
});

export const ApiTransferEditSchema = v.object({
	amount: v.optional(PositiveAmount),
	date: v.optional(v.string()),
	fromAccountId: v.optional(v.string()),
	notes: v.nullish(v.string()),
	toAccountId: v.optional(v.string())
});

export const ApiReassignmentSchema = v.object({
	...BudgetMonthSchema.entries,
	amount: v.pipe(
		MoneySchema,
		v.check((value) => value !== 0, 'Amount must not be zero')
	),
	sourceCategoryId: v.pipe(v.string(), v.minLength(1)),
	// `null` returns the amount to Unassigned (the web sentinel case).
	targetCategoryId: v.nullable(v.pipe(v.string(), v.minLength(1)))
});
