import type { Attachment } from 'svelte/attachments';

export function useDialog(openDialog: () => void): Attachment<HTMLAnchorElement> {
	const clickHandler = createClickHandler(openDialog);
	const keydownHandler = createKeydownHandler(openDialog);
	return (element) => {
		element.addEventListener('click', clickHandler);
		element.addEventListener('keydown', keydownHandler);
		return () => {
			element.removeEventListener('click', clickHandler);
			element.removeEventListener('keydown', keydownHandler);
		};
	};
}

function createClickHandler(callback: () => void) {
	return (e: MouseEvent) => {
		if (
			innerWidth < 640 || // bail screen too small
			e.shiftKey || // or the link is opened in a new window
			e.metaKey ||
			e.ctrlKey || // or a new tab (mac: metaKey, win/linux: ctrlKey)
			e.button !== 0 // or a non-primary mouse button
		) {
			return;
		}
		e.preventDefault();
		callback();
	};
}

function createKeydownHandler(callback: () => void) {
	return (e: KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		callback();
	};
}
