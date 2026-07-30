import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom has no Web Animations API, but Svelte 5 drives transitions through
// element.animate(). Minimal stub that finishes asynchronously (Svelte assigns
// onfinish after the call), so transitions collapse to their end state and
// outroing elements actually leave the DOM in tests.
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	Element.prototype.animate = function () {
		const animation = {
			cancel: () => {},
			currentTime: 0,
			effect: null,
			finished: Promise.resolve(),
			oncancel: null,
			onfinish: null as (() => void) | null,
			pause: () => {},
			playState: 'finished'
		};
		queueMicrotask(() => animation.onfinish?.());
		return animation as unknown as Animation;
	};
}
