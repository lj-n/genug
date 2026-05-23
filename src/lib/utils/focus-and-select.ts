import { tick } from 'svelte';

export function focusAndSelect(ref: HTMLInputElement) {
	tick().then(() => {
		ref.focus();
		ref.select();
	});
}
