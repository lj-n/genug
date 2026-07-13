import type { RemoteQueryUpdate } from '@sveltejs/kit';

import { createAnchoredToast, type ToastPlacement } from './anchored-toast.svelte';
import { type NormalizedFormError, normalizeFormError } from './form-error';

/** The live form instance a remote form hands its `enhance` callback. */
export type EnhancedForm<TForm extends FormSubmitTarget> = Parameters<
	Parameters<TForm['enhance']>[0]
>[0];

export type FormSubmitOptions<TForm extends FormSubmitTarget> = {
	/** Runs after a successful submit — express close, reset-and-continue, etc. here. */
	onSuccess?: (form: EnhancedForm<TForm>) => Promise<void> | void;
	/**
	 * Configures the anchored toast surface. With it, thrown errors go to an
	 * anchored error toast and `error` stays `null` (toast-owns-errors);
	 * `success` additionally pushes a success toast after `onSuccess`.
	 */
	toast?: { placement?: ToastPlacement; success?: () => string };
	/** Queries to refresh single-flight, chained via `submit().updates(...)`. Evaluated per submit. */
	updates?: () => RemoteQueryUpdate[];
};

/**
 * The remote-form surface the primitive drives: `enhance` for the submit
 * lifecycle, `pending` for in-flight state. Structural on purpose so every
 * SvelteKit remote form (including `.for(id)` instances) satisfies it.
 */
export type FormSubmitTarget = {
	enhance: (callback: (form: SubmittedForm) => Promise<void>) => Record<string, unknown>;
	pending: number;
};

/** The submit-capable instance a remote form hands its `enhance` callback. */
type SubmittedForm = {
	element: HTMLFormElement;
	submit: () => Promise<boolean> & {
		updates: (...updates: RemoteQueryUpdate[]) => Promise<boolean>;
	};
};

/**
 * The single submit lifecycle for remote forms (see ADR-0009): per submit it
 * clears the previous error, submits (chaining `updates`), runs `onSuccess`
 * and the success toast on success, and routes thrown errors through
 * {@link normalizeFormError} to exactly one surface — the anchored error
 * toast when `toast` is configured, the returned `error` state otherwise.
 *
 * `form` is a thunk so per-item instances (`form.for(id)`) stay reactive.
 * Spread `attrs` onto the `<form>`; attach `anchor` to the toast origin.
 */
export function createFormSubmit<TForm extends FormSubmitTarget>(
	form: () => TForm,
	options: FormSubmitOptions<TForm> = {}
) {
	const toast = options.toast
		? createAnchoredToast({ placement: options.toast.placement })
		: undefined;

	let error = $state<NormalizedFormError | null>(null);

	const attrs = $derived(
		form().enhance(async (instance) => {
			error = null;
			try {
				const submission = instance.submit();
				const submitted = options.updates
					? await submission.updates(...options.updates())
					: await submission;
				if (!submitted) return;

				await options.onSuccess?.(instance as EnhancedForm<TForm>);
				const message = options.toast?.success?.();
				if (message !== undefined) toast?.success(message);
			} catch (e) {
				const normalized = normalizeFormError(e);
				if (toast) toast.error(normalized.message);
				else error = normalized;
			}
		})
	);

	return {
		/** Toast-origin attachment (`{@attach ...}`); only present when `toast` is configured. */
		anchor: toast?.attach,
		get attrs() {
			return attrs;
		},
		get error() {
			return error;
		},
		get pending() {
			return form().pending > 0;
		},
		/** Clears the inline error, e.g. when a containing dialog closes. */
		reset() {
			error = null;
		}
	};
}
