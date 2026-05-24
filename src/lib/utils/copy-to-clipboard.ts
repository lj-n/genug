import type { Attachment } from 'svelte/attachments';

export function copyToClipboard(text?: string): Attachment<HTMLElement> {
	async function copyText() {
		if (!text) return;
		try {
			if (!('clipboard' in navigator)) {
				throw new Error('Clipboard API not supported');
			}
			await navigator.clipboard.writeText(text);
		} catch (error) {
			console.error(error);
		}
	}

	return (node) => {
		node.addEventListener('click', copyText);
		return () => {
			node.removeEventListener('click', copyText);
		};
	};
}
