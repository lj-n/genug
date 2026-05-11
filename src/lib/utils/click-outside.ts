import type { Attachment } from 'svelte/attachments';

type Args = {
	callback: () => boolean | void;
	// to return focus the callback must return true
	returnFocusTo?: HTMLElement;
};

export function clickOutside({ callback, returnFocusTo }: Args): Attachment<HTMLElement> {
	return (node) => {
		const handleClick = (event: MouseEvent) => {
			if (!node.contains(event.target as Node)) {
				event.stopPropagation();
				if (callback()) {
					returnFocusTo?.focus();
				}
			}
		};

		const useCapture = true;
		document.addEventListener('click', handleClick, useCapture);

		return () => {
			document.removeEventListener('click', handleClick, useCapture);
		};
	};
}
