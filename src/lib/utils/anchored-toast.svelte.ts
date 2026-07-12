import type { Attachment } from 'svelte/attachments';

import { dev } from '$app/environment';

export type AnchoredToastItem = {
	/** Live origin element; `null` once frozen or when pushed without an anchor. */
	anchor: HTMLElement | null;
	dismiss: () => void;
	/** Last known origin rect, captured when the anchor unmounted mid-toast. */
	frozenRect: DOMRect | null;
	id: number;
	message: string;
	pause: () => void;
	resume: () => void;
	variant: ToastVariant;
};

export type ToastVariant = 'error' | 'success';

const DURATION: Record<ToastVariant, number> = { error: 5000, success: 2000 };

/**
 * All live toasts, rendered by the single `<Toaster>` in the root layout.
 * Mutated in place — never reassigned — so the exported proxy stays reactive.
 */
export const toasts = $state<AnchoredToastItem[]>([]);

type TimerState = {
	expiresAt: number;
	/** Milliseconds left while paused; `null` while the timeout is running. */
	remaining: null | number;
	timeout: null | ReturnType<typeof setTimeout>;
};

// Deliberately not SvelteMap: timer bookkeeping is never read by the UI, and
// making it reactive would re-run the Toaster on every pause/resume tick.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const timers = new Map<number, TimerState>();

let nextId = 0;

/**
 * A per-origin toast handle: `{@attach handle.attach}` marks the origin
 * element, `success`/`error` pop a transient bubble anchored to it. One toast
 * per handle — a second push replaces the live toast in place and resets its
 * timer. If the origin unmounts mid-toast, the toast finishes at the frozen
 * last rect; a push without any anchor still renders (viewport-corner
 * fallback) and warns in dev.
 */
export function createAnchoredToast() {
	let anchorEl: HTMLElement | null = null;
	let currentId: null | number = null;

	const attach: Attachment<HTMLElement> = (element) => {
		anchorEl = element;

		return () => {
			if (anchorEl !== element) return;
			anchorEl = null;
			// Cleanup runs before the node leaves the DOM, so the rect is
			// still measurable — snapshot it so the toast can finish in place.
			const live = toasts.find((toast) => toast.id === currentId);
			if (live) {
				live.frozenRect = element.getBoundingClientRect();
				live.anchor = null;
			}
		};
	};

	function push(variant: ToastVariant, message: string) {
		const live = toasts.find((toast) => toast.id === currentId);

		if (live) {
			live.variant = variant;
			live.message = message;
			if (anchorEl) {
				live.anchor = anchorEl;
				live.frozenRect = null;
			}
			startTimer(live.id, DURATION[variant]);
			return;
		}

		if (!anchorEl && dev) {
			console.warn(
				'[anchored-toast] push without a live anchor — did the attachment run? Falling back to the viewport corner.'
			);
		}

		const id = nextId++;
		toasts.push({
			anchor: anchorEl,
			dismiss: () => dismissToast(id),
			frozenRect: null,
			id,
			message,
			pause: () => pauseToast(id),
			resume: () => resumeToast(id),
			variant
		});
		currentId = id;
		startTimer(id, DURATION[variant]);
	}

	return {
		attach,
		error: (message: string) => push('error', message),
		success: (message: string) => push('success', message)
	};
}

function dismissToast(id: number) {
	const timer = timers.get(id);
	if (timer?.timeout) clearTimeout(timer.timeout);
	timers.delete(id);
	const index = toasts.findIndex((toast) => toast.id === id);
	if (index !== -1) toasts.splice(index, 1);
}

function pauseToast(id: number) {
	const timer = timers.get(id);
	if (!timer?.timeout) return;
	clearTimeout(timer.timeout);
	timer.timeout = null;
	timer.remaining = Math.max(0, timer.expiresAt - Date.now());
}

function resumeToast(id: number) {
	const timer = timers.get(id);
	if (!timer || timer.remaining === null) return;
	timer.expiresAt = Date.now() + timer.remaining;
	timer.timeout = setTimeout(() => dismissToast(id), timer.remaining);
	timer.remaining = null;
}

function startTimer(id: number, duration: number) {
	const running = timers.get(id);
	if (running?.timeout) clearTimeout(running.timeout);
	timers.set(id, {
		expiresAt: Date.now() + duration,
		remaining: null,
		timeout: setTimeout(() => dismissToast(id), duration)
	});
}
