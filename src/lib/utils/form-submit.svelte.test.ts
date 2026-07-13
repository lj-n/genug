import { m } from '$lib/paraglide/messages';
import { error as httpError } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toasts } from './anchored-toast.svelte';
import { createFormSubmit } from './form-submit.svelte';

vi.mock('$app/environment', () => ({ browser: true, dev: true }));

type SubmitResult = Promise<boolean> & { updates: (...updates: unknown[]) => Promise<boolean> };

/** Reads `attrs` so the lazy `$derived` runs `enhance` and captures the handler. */
function armed<T extends { attrs: unknown }>(submit: T) {
	void submit.attrs;
	return submit;
}

/**
 * A minimal remote-form double: `enhance` captures the primitive's submit
 * handler, `trigger()` plays one form submission through it.
 */
function mockForm(submit: () => Promise<boolean>, pending = 0) {
	const updateCalls: unknown[][] = [];

	const instance = {
		element: document.createElement('form'),
		submit: (): SubmitResult => {
			const promise = submit() as SubmitResult;
			promise.updates = (...updates: unknown[]) => {
				updateCalls.push(updates);
				return promise;
			};
			return promise;
		}
	};

	let handler: ((form: typeof instance) => Promise<void>) | undefined;

	const form = {
		enhance: (callback: (form: typeof instance) => Promise<void>) => {
			handler = callback;
			return { onsubmit: () => callback(instance) };
		},
		pending
	};

	return {
		form,
		instance,
		trigger: () => handler!(instance),
		updateCalls
	};
}

const forbidden = () => {
	httpError(403, { message: 'You are not allowed to do this.' });
	return Promise.resolve(true); // unreachable — satisfies the type
};

afterEach(() => {
	[...toasts].forEach((toast) => toast.dismiss());
	vi.restoreAllMocks();
});

describe('createFormSubmit — attrs and pending', () => {
	it('spreads the enhanced form attributes from the current form instance', () => {
		const mock = mockForm(() => Promise.resolve(true));
		const submit = createFormSubmit(() => mock.form);

		expect(submit.attrs).toHaveProperty('onsubmit');
	});

	it('projects the form pending counter as a boolean', () => {
		const idle = createFormSubmit(() => mockForm(() => Promise.resolve(true), 0).form);
		const busy = createFormSubmit(() => mockForm(() => Promise.resolve(true), 2).form);

		expect(idle.pending).toBe(false);
		expect(busy.pending).toBe(true);
	});
});

describe('createFormSubmit — success path', () => {
	it('runs onSuccess with the live form instance', async () => {
		const mock = mockForm(() => Promise.resolve(true));
		const onSuccess = vi.fn();
		armed(createFormSubmit(() => mock.form, { onSuccess }));

		await mock.trigger();

		expect(onSuccess).toHaveBeenCalledExactlyOnceWith(mock.instance);
	});

	it('does not run onSuccess when the submit reports validation issues', async () => {
		const mock = mockForm(() => Promise.resolve(false));
		const onSuccess = vi.fn();
		const submit = armed(createFormSubmit(() => mock.form, { onSuccess }));

		await mock.trigger();

		expect(onSuccess).not.toHaveBeenCalled();
		expect(submit.error).toBeNull();
	});

	it('chains the configured updates into the submission', async () => {
		const queryA = () => {};
		const queryB = () => {};
		const mock = mockForm(() => Promise.resolve(true));
		armed(createFormSubmit(() => mock.form, { updates: () => [queryA, queryB] }));

		await mock.trigger();

		expect(mock.updateCalls).toEqual([[queryA, queryB]]);
	});

	it('submits without update chaining when updates is not configured', async () => {
		const mock = mockForm(() => Promise.resolve(true));
		armed(createFormSubmit(() => mock.form));

		await mock.trigger();

		expect(mock.updateCalls).toEqual([]);
	});

	it('pushes the success toast after onSuccess when toast.success is configured', async () => {
		const order: string[] = [];
		const mock = mockForm(() => Promise.resolve(true));
		const submit = armed(
			createFormSubmit(() => mock.form, {
				onSuccess: () => {
					order.push('onSuccess');
				},
				toast: { placement: 'left', success: () => 'Saved' }
			})
		);

		const anchor = document.createElement('button');
		submit.anchor!(anchor);
		await mock.trigger();

		expect(order).toEqual(['onSuccess']);
		expect(toasts).toHaveLength(1);
		expect(toasts[0].variant).toBe('success');
		expect(toasts[0].message).toBe('Saved');
		expect(toasts[0].placement).toBe('left');
		expect(toasts[0].anchor).toBe(anchor);
	});

	it('pushes no success toast when toast is configured without a success message', async () => {
		const mock = mockForm(() => Promise.resolve(true));
		const submit = armed(createFormSubmit(() => mock.form, { toast: {} }));

		submit.anchor!(document.createElement('button'));
		await mock.trigger();

		expect(toasts).toHaveLength(0);
	});
});

describe('createFormSubmit — error routing (toast-owns-errors)', () => {
	it('lands a thrown HttpError in error with its localized message when no toast is configured', async () => {
		const mock = mockForm(forbidden);
		const submit = armed(createFormSubmit(() => mock.form));

		await mock.trigger();

		expect(submit.error).not.toBeNull();
		expect(submit.error!.kind).toBe('known');
		expect(submit.error!.message).toBe('You are not allowed to do this.');
		expect(toasts).toHaveLength(0);
	});

	it('normalizes unexpected errors to the generic localized message', async () => {
		const mock = mockForm(() => Promise.reject(new Error('better-sqlite3 exploded')));
		const submit = armed(createFormSubmit(() => mock.form));

		await mock.trigger();

		expect(submit.error!.kind).toBe('unexpected');
		expect(submit.error!.message).toBe(m.form_error_unexpected());
	});

	it('routes thrown errors to the anchored error toast and keeps error null when toast is configured', async () => {
		const mock = mockForm(forbidden);
		const submit = armed(createFormSubmit(() => mock.form, { toast: {} }));

		submit.anchor!(document.createElement('button'));
		await mock.trigger();

		expect(submit.error).toBeNull();
		expect(toasts).toHaveLength(1);
		expect(toasts[0].variant).toBe('error');
		expect(toasts[0].message).toBe('You are not allowed to do this.');
	});

	it('does not run onSuccess or the success toast on a thrown error', async () => {
		const mock = mockForm(forbidden);
		const onSuccess = vi.fn();
		const submit = armed(
			createFormSubmit(() => mock.form, {
				onSuccess,
				toast: { success: () => 'Saved' }
			})
		);

		submit.anchor!(document.createElement('button'));
		await mock.trigger();

		expect(onSuccess).not.toHaveBeenCalled();
		expect(toasts).toHaveLength(1);
		expect(toasts[0].variant).toBe('error');
	});

	it('clears the previous error at the start of the next submit', async () => {
		let fail = true;
		const mock = mockForm(() => (fail ? Promise.reject(new Error('boom')) : Promise.resolve(true)));
		const submit = armed(createFormSubmit(() => mock.form));

		await mock.trigger();
		expect(submit.error).not.toBeNull();

		fail = false;
		await mock.trigger();
		expect(submit.error).toBeNull();
	});

	it('clears the error on reset()', async () => {
		const mock = mockForm(forbidden);
		const submit = armed(createFormSubmit(() => mock.form));

		await mock.trigger();
		expect(submit.error).not.toBeNull();

		submit.reset();
		expect(submit.error).toBeNull();
	});
});

describe('createFormSubmit — anchor', () => {
	it('exposes no anchor without toast configuration', () => {
		const submit = createFormSubmit(() => mockForm(() => Promise.resolve(true)).form);

		expect(submit.anchor).toBeUndefined();
	});
});
