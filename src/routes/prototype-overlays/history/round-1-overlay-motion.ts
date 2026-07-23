/**
 * Shared open/close motion for the overlay family, used from bits-ui
 * `forceMount` + `child` snippets (the pattern bits-ui recommends for
 * transitions). Design language: quiet and flat — a fast fade plus at
 * most a hint of movement, never a fly-in.
 *
 * - Scrims plain-fade alongside their modal.
 * - Centered modals (dialog, alert-dialog) via `modalScale`.
 * - Anchored surfaces (popover, menus) via `floatingSlide`, keyed off
 *   the `data-side` bits-ui puts on floating content props.
 *
 * The drawer is exempt: vaul-svelte owns its slide/drag motion.
 *
 * ── PROTOTYPE (#258 round 3) ──────────────────────────────────────────
 * The exported transitions currently switch on `motionVariant.current`,
 * driven by `?variant=` on /prototype-overlays, so the live session can
 * compare motion designs. Collapse to the winning variant and delete the
 * switch (and the gallery's use of it) before merging.
 *
 * - a "micro-slide": modals fade + scale from 0.98 (150ms); floating
 *   surfaces fade + 4px slide from the anchor side (120ms).
 * - b "fade only": pure opacity, no movement at all (130/100ms).
 * - c "grow & rise": modals fade + 8px rise (160ms); floating surfaces
 *   fade + scale from 0.95 growing out of the anchor corner (130ms).
 */
import { cubicOut } from 'svelte/easing';
import { fade, fly, scale, type TransitionConfig } from 'svelte/transition';

export type MotionVariant = 'a' | 'b' | 'c';

/** PROTOTYPE — mutable on purpose; read lazily when a transition plays. */
export const motionVariant = { current: 'a' as MotionVariant };

const FLOATING_SLIDE = 4;

/** Anchored surfaces start offset toward their anchor and settle away from it. */
const SLIDE_OFFSETS: Record<string, { x?: number; y?: number }> = {
	bottom: { y: -FLOATING_SLIDE },
	left: { x: FLOATING_SLIDE },
	right: { x: -FLOATING_SLIDE },
	top: { y: FLOATING_SLIDE }
};

const SCRIM_DURATION: Record<MotionVariant, number> = { a: 150, b: 130, c: 160 };

/**
 * Anchored floating surfaces (popover, dropdown menu, submenu). Pass
 * bits-ui's `props['data-side']` as `side`; anything else falls back to
 * the `bottom` behavior.
 */
export function floatingSlide(node: Element, { side }: { side?: unknown } = {}): TransitionConfig {
	switch (motionVariant.current) {
		case 'b':
			return fade(node, { duration: duration(100) });
		case 'c':
			return {
				css: (t) =>
					`transform-origin: var(--bits-floating-transform-origin, center); transform: scale(${0.95 + t * 0.05}); opacity: ${t}`,
				duration: duration(130),
				easing: cubicOut
			};
		default: {
			const offset = (typeof side === 'string' && SLIDE_OFFSETS[side]) || SLIDE_OFFSETS.bottom;
			return fly(node, { duration: duration(120), ...offset });
		}
	}
}

/** Centered modal surfaces (dialog, alert-dialog). */
export function modalScale(node: Element): TransitionConfig {
	switch (motionVariant.current) {
		case 'b':
			return fade(node, { duration: duration(130) });
		case 'c':
			return fly(node, { duration: duration(160), y: 8 });
		default:
			return scale(node, { duration: duration(150), start: 0.98 });
	}
}

/** Scrim behind modal surfaces: plain fade, timed to its modal. */
export function scrimFade(node: Element): TransitionConfig {
	return fade(node, { duration: duration(SCRIM_DURATION[motionVariant.current]) });
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
