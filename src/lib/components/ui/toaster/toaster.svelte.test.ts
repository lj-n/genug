import { toasts } from '$lib/utils/anchored-toast.svelte';
import { createAnchoredToast } from '$lib/utils/anchored-toast.svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import Toaster from './toaster.svelte';

// jsdom lacks the Web Animations API the bubble's transition calls into.
// Fire `onfinish` as soon as it is assigned so outros complete and unmount.
beforeAll(() => {
	Element.prototype.animate ??= function () {
		const animation = { cancel() {}, finished: Promise.resolve() };
		Object.defineProperty(animation, 'onfinish', {
			configurable: true,
			set: (cb: () => void) => queueMicrotask(cb)
		});
		return animation as unknown as Animation;
	};

	// jsdom has no ResizeObserver; Floating UI's autoUpdate observes the anchor.
	globalThis.ResizeObserver ??= class {
		disconnect() {}
		observe() {}
		unobserve() {}
	};

	// jsdom has no matchMedia; the bubble queries prefers-reduced-motion.
	window.matchMedia ??= (query: string) =>
		({
			addEventListener() {},
			matches: false,
			media: query,
			removeEventListener() {}
		}) as unknown as MediaQueryList;
});

afterEach(() => {
	[...toasts].forEach((toast) => toast.dismiss());
});

function pushAnchored(variant: 'error' | 'success', message: string) {
	const handle = createAnchoredToast();
	const anchor = document.createElement('button');
	document.body.appendChild(anchor);
	handle.attach(anchor);
	handle[variant](message);
	return handle;
}

describe('Toaster', () => {
	it('renders a success toast as a polite status with its message', async () => {
		render(Toaster);
		pushAnchored('success', 'Saved');

		const status = await screen.findByRole('status');
		expect(status).toHaveTextContent('Saved');
		expect(status).toHaveAttribute('aria-live', 'polite');
		expect(status).toHaveAttribute('aria-atomic', 'true');
	});

	it('renders an error toast as an assertive alert', async () => {
		render(Toaster);
		pushAnchored('error', 'Boom');

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Boom');
		expect(alert).toHaveAttribute('aria-live', 'assertive');
		expect(alert).toHaveAttribute('aria-atomic', 'true');
	});

	it('dismisses a toast when its bubble is clicked', async () => {
		render(Toaster);
		pushAnchored('success', 'Saved');

		const bubble = await screen.findByRole('button', { name: /Saved/ });
		bubble.click();

		await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
		expect(toasts).toHaveLength(0);
	});

	it('swaps an error toast to success in place', async () => {
		render(Toaster);
		const handle = pushAnchored('error', 'Boom');

		await screen.findByRole('alert');
		handle.success('Saved');

		const status = await screen.findByRole('status');
		expect(status).toHaveTextContent('Saved');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
