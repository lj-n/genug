/**
 * Shared open/close motion for the overlay family, used from bits-ui
 * `forceMount` + `child` snippets (the pattern bits-ui recommends for
 * transitions).
 *
 * Asymmetric by design: overlays spring/ease IN, and always exit with a
 * quick plain fade (`modalOut`/`floatingOut`) — spring curves look wrong
 * played backwards. Scrims plain-fade both ways (`scrimFade`). The drawer
 * is exempt: vaul-svelte owns its slide/drag motion.
 *
 * ── PROTOTYPE (#258 round 3, spring round) ────────────────────────────
 * The enter transitions switch on `motionVariant.current`, driven by
 * `?variant=` on /prototype-overlays, so the live session can compare
 * motion designs. Collapse to the winning variant and delete the switch
 * (and the gallery's use of it) before merging. Round-1 (non-spring)
 * variants: src/routes/prototype-overlays/history/round-1-overlay-motion.ts
 *
 * Round 3 — all slots are takes on the round-2 winner "slingshot"
 * (directional entry with overshoot):
 * - a "slingshot light": shorter travel, gentler overshoot, faster —
 *   the restrained production-friendly reading.
 * - b "slingshot bounce": long drop that lands with a damped bounce
 *   (overshoots the resting point, springs back, settles).
 * - c "slingshot": the round-2 winner, unchanged. Modals drop in from
 *   24px with a hard overshoot; floating surfaces sling 12px in from
 *   the anchor side.
 */
import { fade, type TransitionConfig } from 'svelte/transition';

export type MotionVariant = 'a' | 'b' | 'c';

/** PROTOTYPE — mutable on purpose; read lazily when a transition plays. */
export const motionVariant = { current: 'a' as MotionVariant };

/** Unit direction a floating surface travels in from, per bits-ui `data-side`. */
const SLIDE_DIRS: Record<string, { x: number; y: number }> = {
	bottom: { x: 0, y: -1 },
	left: { x: 1, y: 0 },
	right: { x: -1, y: 0 },
	top: { x: 0, y: 1 }
};

/**
 * Anchored floating surfaces (popover, dropdown menu, submenu) entering.
 * Pass bits-ui's `props['data-side']` as `side`; anything else falls back
 * to the `bottom` behavior.
 */
export function floatingIn(node: Element, { side }: { side?: unknown } = {}): TransitionConfig {
	const dir = (typeof side === 'string' && SLIDE_DIRS[side]) || SLIDE_DIRS.bottom;
	switch (motionVariant.current) {
		case 'b': {
			const ease = springBounce(4, 3 * Math.PI);
			return {
				css: (t) =>
					`transform: translate(${dir.x * 16 * (1 - ease(t))}px, ${dir.y * 16 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
				duration: duration(400)
			};
		}
		case 'c': {
			const ease = backOut(2.6);
			return {
				css: (t) =>
					`transform: translate(${dir.x * 12 * (1 - ease(t))}px, ${dir.y * 12 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
				duration: duration(280)
			};
		}
		default: {
			const ease = backOut(2);
			return {
				css: (t) =>
					`transform: translate(${dir.x * 8 * (1 - ease(t))}px, ${dir.y * 8 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
				duration: duration(200)
			};
		}
	}
}

/** Floating surfaces exit with a quick fade regardless of variant. */
export function floatingOut(node: Element): TransitionConfig {
	return fade(node, { duration: duration(100) });
}

/** Centered modal surfaces (dialog, alert-dialog) entering. */
export function modalIn(_node: Element): TransitionConfig {
	switch (motionVariant.current) {
		case 'b': {
			const ease = springBounce(4, 3 * Math.PI);
			return {
				css: (t) => `transform: translateY(${-36 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
				duration: duration(480)
			};
		}
		case 'c': {
			const ease = backOut(2.6);
			return {
				css: (t) => `transform: translateY(${-24 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
				duration: duration(320)
			};
		}
		default: {
			const ease = backOut(2);
			return {
				css: (t) => `transform: translateY(${-12 * (1 - ease(t))}px); opacity: ${fadeIn(t)}`,
				duration: duration(240)
			};
		}
	}
}

/** Modal surfaces exit with a quick fade regardless of variant. */
export function modalOut(node: Element): TransitionConfig {
	return fade(node, { duration: duration(130) });
}

/** Scrim behind modal surfaces: plain fade both ways. */
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

/** Damped oscillation settling at 1: e^-decay envelope around cos(omega·t). */
function springBounce(decay: number, omega: number) {
	return (t: number) => 1 - Math.exp(-decay * t) * Math.cos(omega * t);
}
