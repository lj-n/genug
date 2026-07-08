/**
 * Canonical focus treatment for interactive elements. Every focusable
 * element draws this ring instead of the browser default outline.
 *
 * Both flavors must express the same treatment; only the trigger differs.
 */

/** `focus-visible:` flavor — for elements that receive focus directly. */
export const focusRing = 'focus-visible:ring-2 focus-visible:ring-focus';

/**
 * Container flavor — rings only while the wrapped form control (input,
 * select, textarea) is focus-visible. Other focusables inside the container
 * (e.g. combobox trigger buttons) draw their own ring via the global rule.
 */
export const focusRingWithin =
	'has-[:is(input,select,textarea):focus-visible]:ring-2 has-[:is(input,select,textarea):focus-visible]:ring-focus';
