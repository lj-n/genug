import { render, screen } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Button from './button.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Save</span>' }));

async function advance(ms: number) {
	vi.advanceTimersByTime(ms);
	await tick();
}

function spinner() {
	return document.querySelector('[data-slot="button-spinner"]');
}

beforeEach(() => {
	// Svelte flushes via real microtasks; faking those would deadlock `tick()`.
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
	vi.useRealTimers();
});

describe('Button — loading', () => {
	it('is disabled and marked busy immediately, before the spinner appears', async () => {
		render(Button, { props: { children: label, loading: true } });

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(spinner()).toBeNull();
	});

	it('shows no spinner at all when loading ends within the delay window', async () => {
		const { rerender } = render(Button, { props: { children: label, loading: true } });

		await advance(150);
		expect(spinner()).toBeNull();

		await rerender({ loading: false });
		await advance(10_000);

		expect(spinner()).toBeNull();
		expect(screen.getByRole('button')).toBeEnabled();
		expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
	});

	it('shows the spinner once the submit is still pending after the delay', async () => {
		render(Button, { props: { children: label, loading: true } });

		await advance(199);
		expect(spinner()).toBeNull();

		await advance(1);
		expect(spinner()).not.toBeNull();
	});

	it('keeps the label in the DOM while the spinner is visible, so the button never changes size', async () => {
		render(Button, { props: { children: label, loading: true } });

		await advance(200);

		expect(spinner()).not.toBeNull();
		const button = screen.getByRole('button');
		expect(button).toHaveTextContent('Save');
	});

	it('keeps the spinner visible for the minimum time when loading ends right after it appeared', async () => {
		const { rerender } = render(Button, { props: { children: label, loading: true } });

		await advance(200);
		expect(spinner()).not.toBeNull();

		await rerender({ loading: false });
		await advance(249);
		expect(spinner()).not.toBeNull();

		await advance(1);
		expect(spinner()).toBeNull();
	});

	it('hides the spinner immediately when loading ends after the minimum visible time', async () => {
		const { rerender } = render(Button, { props: { children: label, loading: true } });

		await advance(200);
		await advance(250);
		expect(spinner()).not.toBeNull();

		await rerender({ loading: false });
		await tick();

		expect(spinner()).toBeNull();
	});

	it('re-enables the button and clears busy state when loading ends', async () => {
		const { rerender } = render(Button, { props: { children: label, loading: true } });

		await advance(200);
		await rerender({ loading: false });
		await advance(250);

		const button = screen.getByRole('button');
		expect(button).toBeEnabled();
		expect(button).not.toHaveAttribute('aria-busy');
	});

	it('does not restart the spinner cycle for a fast follow-up submit after one completed', async () => {
		const { rerender } = render(Button, { props: { children: label, loading: true } });

		await advance(200);
		await advance(250);
		await rerender({ loading: false });
		await tick();
		expect(spinner()).toBeNull();

		await rerender({ loading: true });
		await advance(150);
		await rerender({ loading: false });
		await advance(10_000);

		expect(spinner()).toBeNull();
	});
});
