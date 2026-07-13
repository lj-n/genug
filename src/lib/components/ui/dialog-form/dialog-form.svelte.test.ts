import type { NormalizedFormError } from '$lib/utils/form-error';

import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import Fixture from './dialog-form.test-fixture.svelte';

/**
 * A remote-form double for the DialogForm `form` prop: submitting the dialog's
 * form plays `submit` through the primitive's lifecycle.
 */
function mockForm(submit: () => Promise<boolean>, pending = 0) {
	type SubmitResult = Promise<boolean> & { updates: (...updates: unknown[]) => Promise<boolean> };

	const instance = {
		element: document.createElement('form'),
		submit: (): SubmitResult => {
			const promise = submit() as SubmitResult;
			promise.updates = () => promise;
			return promise;
		}
	};

	return {
		enhance: (callback: (form: typeof instance) => Promise<void>) => ({
			onsubmit: (event: SubmitEvent) => {
				event.preventDefault();
				return callback(instance);
			}
		}),
		pending
	};
}

// Opening a Dialog makes bits-ui lock body scroll; unmounting schedules a
// ~24ms `setTimeout` cleanup that touches `document.body`. If that timer fires
// after vitest tears down jsdom, it throws `document is not defined`. Unmount
// eagerly and wait past the delay so the cleanup runs while document is alive.
afterEach(async () => {
	cleanup();
	await new Promise((resolve) => setTimeout(resolve, 50));
});

// jsdom lacks the Web Animations API the dialog's exit transition calls into.
// Fire `onfinish` as soon as it is assigned so the outro completes and the
// dialog content unmounts (otherwise the paused branch keeps stale nodes).
beforeAll(() => {
	Element.prototype.animate ??= function () {
		const animation = { cancel() {}, finished: Promise.resolve() };
		Object.defineProperty(animation, 'onfinish', {
			configurable: true,
			set: (cb: () => void) => queueMicrotask(cb)
		});
		return animation as unknown as Animation;
	};
});

const throwsHttp = () => {
	error(403, { message: 'You are not allowed to do this.' });
	return Promise.resolve(true); // unreachable — satisfies the type
};

const throwsUnexpected = () => Promise.reject(new Error('better-sqlite3 exploded'));

describe('DialogForm — success', () => {
	it('closes the dialog on a successful submit by default', async () => {
		render(Fixture, { props: { form: mockForm(() => Promise.resolve(true)), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('stays open when the submit reports validation issues', async () => {
		render(Fixture, { props: { form: mockForm(() => Promise.resolve(false)), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('lets onSuccess replace the default close behavior', async () => {
		let received: unknown;
		render(Fixture, {
			props: {
				form: mockForm(() => Promise.resolve(true)),
				onSuccess: (form: unknown) => {
					received = form;
				},
				open: true
			}
		});

		screen.getByRole('button', { name: 'Save' }).click();

		await waitFor(() => expect(received).toBeDefined());
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(received).toHaveProperty('element');
	});
});

describe('DialogForm — footer', () => {
	it('hands pending to the footer snippet', async () => {
		render(Fixture, { props: { form: mockForm(() => Promise.resolve(true), 1), open: true } });

		expect(screen.getByTestId('pending')).toHaveTextContent('true');
	});

	it('reports pending false while no submission is in flight', async () => {
		render(Fixture, { props: { form: mockForm(() => Promise.resolve(true)), open: true } });

		expect(screen.getByTestId('pending')).toHaveTextContent('false');
	});
});

describe('DialogForm — thrown error surface', () => {
	it('renders the built-in default inline error on a thrown non-validation error', async () => {
		render(Fixture, { props: { form: mockForm(throwsUnexpected), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent(m.form_error_unexpected());
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('shows the localized HttpError body message, not internal text', async () => {
		render(Fixture, { props: { form: mockForm(throwsHttp), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('You are not allowed to do this.');
		expect(alert).not.toHaveTextContent(m.form_error_unexpected());
	});

	it('does not leak internal error text for unexpected errors', async () => {
		render(Fixture, { props: { form: mockForm(throwsUnexpected), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		await screen.findByRole('alert');
		expect(screen.queryByText(/better-sqlite3/)).not.toBeInTheDocument();
	});

	it('lets the errors snippet override the default and receive the normalized shape', async () => {
		const errors = createRawSnippet((getErr: () => NormalizedFormError) => {
			const err = getErr();
			return {
				render: () => `<p data-testid="custom-error">custom:${err.kind}:${err.message}</p>`
			};
		});

		render(Fixture, {
			props: { errors, form: mockForm(throwsUnexpected), open: true }
		});

		screen.getByRole('button', { name: 'Save' }).click();

		const custom = await screen.findByTestId('custom-error');
		expect(custom).toHaveTextContent(`custom:unexpected:${m.form_error_unexpected()}`);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('clears the error when the dialog closes and does not flash it on reopen', async () => {
		const { rerender } = render(Fixture, {
			props: { form: mockForm(throwsUnexpected), open: true }
		});

		screen.getByRole('button', { name: 'Save' }).click();
		await screen.findByRole('alert');

		await rerender({ open: false });
		await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());

		await rerender({ open: true });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
