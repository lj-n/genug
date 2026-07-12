import { m } from '$lib/paraglide/messages';
import { isHttpError } from '@sveltejs/kit';

/**
 * A thrown remote-form error normalized into a user-facing shape.
 *
 * - `known`: an `HttpError` raised by our own `error(4xx, …)` calls; its body
 *   message is already localized and safe to display.
 * - `unexpected`: anything else (500 / DB / network / thrown `Error`); mapped
 *   to a generic localized fallback so internal error text never leaks.
 */
export type NormalizedFormError = {
	kind: 'known' | 'unexpected';
	message: string;
	raw: unknown;
};

/**
 * Normalize an unknown thrown error from a remote-form submit into a
 * user-facing {@link NormalizedFormError}. Known `HttpError`s surface their
 * localized body message; everything else maps to `form_error_unexpected`.
 */
export function normalizeFormError(error: unknown): NormalizedFormError {
	if (isHttpError(error)) {
		return { kind: 'known', message: error.body.message, raw: error };
	}

	return { kind: 'unexpected', message: m.form_error_unexpected(), raw: error };
}
