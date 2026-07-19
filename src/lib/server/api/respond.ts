/**
 * HTTP plumbing for the additive native-client API (map #190, ticket #195).
 *
 * The web app answers through remote functions; this surface is a parallel
 * transport of `+server.ts` routes over the same `user-context`. Everything
 * these helpers do is presentation: the error envelope the contract promises
 * (`{ code, message }`), the optional client-version gate, and the `Month`
 * query/path parsing shared across the write endpoints. No business rules
 * live here — those stay in `user-context`.
 */

import type { Logger } from 'pino';

import { m } from '$lib/paraglide/messages';
import { type Month, parseMonth } from '$lib/utils/month';
import { error, isHttpError, json } from '@sveltejs/kit';
import * as v from 'valibot';

/** The contract's `Error` schema (`src/lib/server/api/contract.ts`). */
export type ErrorEnvelope = { code: string; message: string };

/**
 * Minimum supported client version per platform (`X-Genug-Client` value's
 * `<platform>` half). Empty until a native client actually ships and an old
 * build needs locking out; the 426 mechanism exists now so the contract's
 * `client_upgrade_required` path is real and testable (map decision 15).
 */
export const MINIMUM_CLIENT_VERSIONS: Record<string, string> = {};

export function apiError(status: number, code: string, message: string): Response {
	return json({ code, message } satisfies ErrorEnvelope, { status });
}

export const ok = (body: unknown) => ({ body, status: 200 });
export const created = (body: unknown) => ({ body, status: 201 });

/**
 * The `X-Genug-Client` gate. The header is optional (generated clients inject
 * it via middleware, older callers may omit it), so a missing or malformed
 * value passes; only a present, well-formed version below its platform's
 * minimum is rejected. Returns the 426 message, or `null` to allow.
 */
export function clientVersionIssue(
	header: null | string,
	minimums: Record<string, string> = MINIMUM_CLIENT_VERSIONS
): null | string {
	if (!header) return null;

	const match = /^([a-z-]+)\/([0-9][A-Za-z0-9.-]*)$/.exec(header);
	if (!match) return null;

	const [, platform, version] = match;
	const minimum = minimums[platform];
	if (minimum && compareVersions(version, minimum) < 0) {
		return `Client ${header} is below the supported minimum ${platform}/${minimum}.`;
	}
	return null;
}

/**
 * Parse a `Month` from a path or query value, rejecting anything outside the
 * `YYYYMM` range with a 400 — the domain queries assume a valid `Month`.
 */
export function parseMonthOrThrow(value: null | string): Month {
	const month = value === null ? null : parseMonth(value);
	if (month === null) error(400, 'Invalid or missing month; expected YYYYMM.');
	return month;
}

/**
 * Translate a thrown error into the contract's `{ code, message }` envelope.
 * Valibot failures are 400s; SvelteKit `HttpError`s keep their status and
 * message and gain a stable `code`; anything else is a logged 500.
 */
export function toErrorResponse(err: unknown, logger?: Logger): Response {
	if (v.isValiError(err)) {
		return apiError(400, 'validation_error', err.issues[0]?.message ?? 'Invalid request body.');
	}

	if (isHttpError(err)) {
		const message =
			err.body && typeof err.body === 'object' && 'message' in err.body
				? String(err.body.message)
				: String(err.body);
		return apiError(err.status, codeForHttpError(err.status, message), message);
	}

	logger?.error({ err }, 'unhandled api error');
	return apiError(500, 'internal_error', 'An unexpected error occurred.');
}

/**
 * Map a domain error to a stable machine code. The two rules the contract
 * names explicitly (`account_archived`, `transaction_is_transfer_leg`) are
 * matched by their rendered message — the throw and this catch run in the
 * same request, hence the same Paraglide locale, so the strings are equal.
 * Everything else falls back to a status-derived code.
 */
function codeForHttpError(status: number, message: string): string {
	if (message === m.error_account_archived()) return 'account_archived';
	if (message === m.error_transaction_is_transfer_leg()) return 'transaction_is_transfer_leg';

	switch (status) {
		case 400:
			return 'bad_request';
		case 401:
			return 'unauthorized';
		case 403:
			return 'forbidden';
		case 404:
			return 'not_found';
		case 426:
			return 'client_upgrade_required';
		default:
			return 'error';
	}
}

/** Numeric dot-segment comparison; missing segments read as 0. */
function compareVersions(a: string, b: string): number {
	const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
	const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
	const len = Math.max(pa.length, pb.length);
	for (let i = 0; i < len; i++) {
		const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
		if (diff !== 0) return diff > 0 ? 1 : -1;
	}
	return 0;
}
