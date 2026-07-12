import type { NormalizedFormError } from '$lib/utils/form-error';

import { m } from '$lib/paraglide/messages';
import { error } from '@sveltejs/kit';
import { render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeAll, describe, expect, it } from 'vitest';

import Fixture from './dialog-form.test-fixture.svelte';

/**
 * A mock of a remote-form's `enhance`: returns props for the `<form>` whose
 * `onsubmit` drives the DialogForm submit wrapper with the given `submit`.
 */
function mockEnhance(submit: () => Promise<boolean>) {
	return (onSubmit: (form: { submit: () => Promise<boolean> }) => Promise<void>) => ({
		onsubmit: (event: SubmitEvent) => {
			event.preventDefault();
			return onSubmit({ submit });
		}
	});
}

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

describe('DialogForm — thrown error surface', () => {
	it('renders the built-in default inline error on a thrown non-validation error', async () => {
		render(Fixture, { props: { enhance: mockEnhance(throwsUnexpected), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent(m.form_error_unexpected());
	});

	it('shows the localized HttpError body message, not internal text', async () => {
		render(Fixture, { props: { enhance: mockEnhance(throwsHttp), open: true } });

		screen.getByRole('button', { name: 'Save' }).click();

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('You are not allowed to do this.');
		expect(alert).not.toHaveTextContent(m.form_error_unexpected());
	});

	it('does not leak internal error text for unexpected errors', async () => {
		render(Fixture, { props: { enhance: mockEnhance(throwsUnexpected), open: true } });

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
			props: { enhance: mockEnhance(throwsUnexpected), errors, open: true }
		});

		screen.getByRole('button', { name: 'Save' }).click();

		const custom = await screen.findByTestId('custom-error');
		expect(custom).toHaveTextContent(`custom:unexpected:${m.form_error_unexpected()}`);
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('clears the error when the dialog closes and does not flash it on reopen', async () => {
		const { rerender } = render(Fixture, {
			props: { enhance: mockEnhance(throwsUnexpected), open: true }
		});

		screen.getByRole('button', { name: 'Save' }).click();
		await screen.findByRole('alert');

		await rerender({ open: false });
		await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());

		await rerender({ open: true });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
