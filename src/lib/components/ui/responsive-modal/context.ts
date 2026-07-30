import { getContext, hasContext, setContext } from 'svelte';

/** Viewport at or above which the shell renders as a Dialog instead of a Drawer. */
export const DESKTOP_QUERY = '(min-width: 640px)';

const CONTEXT_KEY = Symbol('responsive-modal');

export type ResponsiveModalContext = {
	/**
	 * Closes the modal through the bound `open` state — the only close path
	 * vaul honours when `dismissible` is `false` (its own Close and Escape
	 * handling are no-ops then).
	 */
	close(): void;
	/**
	 * When `false`, interacting outside the modal does not close it — the Dialog
	 * variant ignores outside clicks, the Drawer variant is non-dismissible.
	 */
	readonly dismissible: boolean;
	/** `true` renders the Dialog variant, `false` the Drawer variant. Reactive. */
	readonly isDesktop: boolean;
};

export function getResponsiveModalContext(): ResponsiveModalContext {
	if (!hasContext(CONTEXT_KEY)) {
		throw new Error('ResponsiveModal sub-components must be used within <ResponsiveModal.Root>.');
	}
	return getContext(CONTEXT_KEY);
}

export function setResponsiveModalContext(context: ResponsiveModalContext): void {
	setContext(CONTEXT_KEY, context);
}
