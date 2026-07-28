/**
 * Canonical focus treatment for interactive elements. Every focusable
 * element draws this ring instead of the browser default outline.
 *
 * Both flavors must express the same treatment; only the trigger differs.
 */

/**
 * Hover feedback (P7): gold stays reserved for keyboard focus.
 * `:not(:disabled)` guards form controls that keep pointer events while
 * disabled.
 */
export const hoverOutline =
	'hover:not-disabled:outline-1 hover:not-disabled:-outline-offset-1 hover:not-disabled:outline-foreground/50';

/**
 * Error halo for invalid controls (the always-on red border is separate).
 * Suppressed while the control draws its focus ring — the ring utilities
 * would otherwise override the gold "keyboard focus is here" ring (P7).
 */
export const invalidRing =
	'aria-invalid:not-focus-visible:ring-3 aria-invalid:not-focus-visible:ring-error/20';

/**
 * Container flavor — for wrappers marked aria-invalid whose focus ring is
 * driven by a wrapped form control (`focusRingWithin`), so the suppression
 * must key off that child's focus-visible, not the wrapper's own.
 */
export const invalidRingWithin =
	'aria-invalid:not-has-[:is(input,select,textarea):focus-visible]:ring-3 aria-invalid:not-has-[:is(input,select,textarea):focus-visible]:ring-error/20';

/** `focus-visible:` flavor — for elements that receive focus directly. */
export const focusRing = 'focus-visible:ring-2 focus-visible:ring-focus';

/**
 * Container flavor — rings only while the wrapped form control (input,
 * select, textarea) is focus-visible. Other focusables inside the container
 * (e.g. combobox trigger buttons) draw their own ring via the global rule.
 */
export const focusRingWithin =
	'has-[:is(input,select,textarea):focus-visible]:ring-2 has-[:is(input,select,textarea):focus-visible]:ring-focus';
