/**
 * Shared open/close motion for the overlay family, used from bits-ui
 * `forceMount` + `child` snippets (the pattern bits-ui recommends for
 * transitions).
 *
 * Surfaces enter with a short directional travel and a slight overshoot
 * (backOut), and always exit with a quick plain fade — spring curves look
 * wrong played backwards, hence the `in:`/`out:` split instead of
 * `transition:`. The drawer is exempt: vaul-svelte owns its slide/drag
 * motion.
 */
import { fade, type TransitionConfig } from 'svelte/transition';

const OVERSHOOT = 2;

/** Unit direction a floating surface travels in from, per bits-ui `data-side`. */
const SLIDE_DIRS: Record<string, { x: number; y: number }> = {
	bottom: { x: 0, y: -1 },
	left: { x: 1, y: 0 },
	right: { x: -1, y: 0 },
	top: { x: 0, y: 1 }
};

/**
 * Anchored floating surfaces (popover, menus, select) entering. Pass
 * bits-ui's `props['data-side']` as `side`; anything else falls back to
 * the `bottom` behavior.
 */
export function floatingIn(node: Element, { side }: { side?: unknown } = {}): TransitionConfig {
	const dir = (typeof side === 'string' && SLIDE_DIRS[side]) || SLIDE_DIRS.bottom;
	const ease = backOut(OVERSHOOT);
	return {
		css: (t) =>
			`transform: translate(${dir.x * 8 * (1 - ease(t))}px, ${dir.y * 8 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
		duration: duration(200)
	};
}

export function floatingOut(node: Element): TransitionConfig {
	return fade(node, { duration: duration(100) });
}

/** Centered modal surfaces (dialog, alert-dialog) entering. */
export function modalIn(_node: Element): TransitionConfig {
	const ease = backOut(OVERSHOOT);
	return {
		css: (t) => `transform: translateY(${-12 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
		duration: duration(240)
	};
}

export function modalOut(node: Element): TransitionConfig {
	return fade(node, { duration: duration(130) });
}

/** Scrim behind modal surfaces. */
export function scrimFade(node: Element): TransitionConfig {
	return fade(node, { duration: duration(200) });
}

/** Ease-out with overshoot; `s` scales how far past 1 it swings. */
function backOut(s: number) {
	return (t: number) => {
		const u = t - 1;
		return 1 + u * u * ((s + 1) * u + s);
	};
}

/**
 * Transitions only ever play in the browser, so the media query is read
 * lazily at play time. Guarded existence check instead of `svelte/motion`'s
 * `prefersReducedMotion`: jsdom (component tests) implements neither
 * `MediaQuery`'s module-load listener nor `matchMedia` itself, and a throw
 * here is swallowed by the transition machinery, leaving overlays stuck.
 */
function duration(base: number): number {
	const reduced =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	return reduced ? 0 : base;
}

/** Opacity ramps in over the first 40% so the spring reads as movement, not fade. */
function fadeIn(t: number) {
	return Math.min(1, t / 0.4);
}
