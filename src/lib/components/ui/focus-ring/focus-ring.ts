/**
 * Canonical focus treatment for interactive elements. Every focusable
 * element draws this ring instead of the browser default outline.
 *
 * Both flavors must express the same treatment; only the trigger differs.
 */

/** `focus-visible:` flavor — for elements that receive focus directly. */
export const focusRing =
	'focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/50';

/** `focus-within:` flavor — for containers that wrap a focusable child. */
export const focusRingWithin =
	'focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/50';
