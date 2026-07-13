import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAnchoredToast, toasts } from './anchored-toast.svelte';

vi.mock('$app/environment', () => ({ browser: true, dev: true }));

function attachTo(handle: ReturnType<typeof createAnchoredToast>) {
	const element = document.createElement('button');
	const detach = handle.attach(element) as () => void;
	return { detach, element };
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	[...toasts].forEach((toast) => toast.dismiss());
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('createAnchoredToast', () => {
	it('anchors a pushed toast to the attached element', () => {
		const handle = createAnchoredToast();
		const { element } = attachTo(handle);

		handle.success('Saved');

		expect(toasts).toHaveLength(1);
		expect(toasts[0].variant).toBe('success');
		expect(toasts[0].message).toBe('Saved');
		expect(toasts[0].anchor).toBe(element);
		expect(toasts[0].frozenRect).toBeNull();
	});

	it('defaults to top placement and carries a configured placement', () => {
		const top = createAnchoredToast();
		const left = createAnchoredToast({ placement: 'left' });
		attachTo(top);
		attachTo(left);

		top.success('Saved');
		left.success('Saved');

		expect(toasts[0].placement).toBe('top');
		expect(toasts[1].placement).toBe('left');
	});

	it('auto-dismisses success after 2s and error after 5s', () => {
		const success = createAnchoredToast();
		const error = createAnchoredToast();
		attachTo(success);
		attachTo(error);

		success.success('Saved');
		error.error('Boom');
		expect(toasts).toHaveLength(2);

		vi.advanceTimersByTime(1999);
		expect(toasts).toHaveLength(2);

		vi.advanceTimersByTime(1);
		expect(toasts).toHaveLength(1);
		expect(toasts[0].variant).toBe('error');

		vi.advanceTimersByTime(2999);
		expect(toasts).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toasts).toHaveLength(0);
	});

	it('replaces a live toast from the same origin in place and resets its timer', () => {
		const handle = createAnchoredToast();
		attachTo(handle);

		handle.success('First');
		const id = toasts[0].id;

		vi.advanceTimersByTime(1500);
		handle.success('Second');

		expect(toasts).toHaveLength(1);
		expect(toasts[0].id).toBe(id);
		expect(toasts[0].message).toBe('Second');

		vi.advanceTimersByTime(1999);
		expect(toasts).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toasts).toHaveLength(0);
	});

	it('swaps error to success in place and applies the success duration', () => {
		const handle = createAnchoredToast();
		attachTo(handle);

		handle.error('Boom');
		const id = toasts[0].id;

		handle.success('Saved');

		expect(toasts).toHaveLength(1);
		expect(toasts[0].id).toBe(id);
		expect(toasts[0].variant).toBe('success');
		expect(toasts[0].message).toBe('Saved');

		vi.advanceTimersByTime(2000);
		expect(toasts).toHaveLength(0);
	});

	it('pauses the timer and resumes with the remaining time', () => {
		const handle = createAnchoredToast();
		attachTo(handle);

		handle.success('Saved');
		vi.advanceTimersByTime(1000);

		toasts[0].pause();
		vi.advanceTimersByTime(60_000);
		expect(toasts).toHaveLength(1);

		toasts[0].resume();
		vi.advanceTimersByTime(999);
		expect(toasts).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(toasts).toHaveLength(0);
	});

	it('dismisses immediately on dismiss()', () => {
		const handle = createAnchoredToast();
		attachTo(handle);

		handle.error('Boom');
		toasts[0].dismiss();

		expect(toasts).toHaveLength(0);
	});

	it('freezes at the last anchor rect when the anchor unmounts mid-toast', () => {
		const handle = createAnchoredToast();
		const { detach, element } = attachTo(handle);
		const rect = new DOMRect(10, 20, 30, 40);
		element.getBoundingClientRect = () => rect;

		handle.success('Saved');
		detach();

		expect(toasts).toHaveLength(1);
		expect(toasts[0].anchor).toBeNull();
		expect(toasts[0].frozenRect).toBe(rect);

		vi.advanceTimersByTime(2000);
		expect(toasts).toHaveLength(0);
	});

	it('keeps the frozen position when a push replaces a frozen toast', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const handle = createAnchoredToast();
		const { detach, element } = attachTo(handle);
		const rect = new DOMRect(10, 20, 30, 40);
		element.getBoundingClientRect = () => rect;

		handle.error('Boom');
		detach();
		handle.success('Saved');

		expect(toasts).toHaveLength(1);
		expect(toasts[0].variant).toBe('success');
		expect(toasts[0].frozenRect).toBe(rect);
		expect(warn).not.toHaveBeenCalled();
	});

	it('never drops a push without a live anchor: renders unanchored and warns in dev', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const handle = createAnchoredToast();

		handle.error('Boom');

		expect(toasts).toHaveLength(1);
		expect(toasts[0].message).toBe('Boom');
		expect(toasts[0].anchor).toBeNull();
		expect(toasts[0].frozenRect).toBeNull();
		expect(warn).toHaveBeenCalledOnce();
	});

	it('creates a fresh toast when pushing after the previous one expired', () => {
		const handle = createAnchoredToast();
		attachTo(handle);

		handle.success('First');
		const firstId = toasts[0].id;
		vi.advanceTimersByTime(2000);
		expect(toasts).toHaveLength(0);

		handle.success('Second');
		expect(toasts).toHaveLength(1);
		expect(toasts[0].id).not.toBe(firstId);
	});
});
