import { onDestroy } from 'svelte';

export class SingletonToast {
	show = $state(false);
	timeout: NodeJS.Timeout | null = null;

	constructor(public duration = 2000) {
		onDestroy(() => {
			if (this.timeout) clearTimeout(this.timeout);
		});
	}

	trigger() {
		this.show = true;
		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.show = false;
		}, this.duration);
	}
}

export function createSingletonToast(duration?: number) {
	return new SingletonToast(duration);
}
