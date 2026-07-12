import { browser } from '$app/environment';

/**
 * Reactive `window.matchMedia` wrapper.
 *
 * Instantiate inside a component's `<script>` so the internal `$effect` can
 * subscribe to media changes and clean up on destroy. On the server (and before
 * hydration) `matches` falls back to `defaultValue`.
 */
export class MediaQuery {
	matches = $state(false);
	#query: string;

	constructor(query: string, defaultValue = false) {
		this.#query = query;
		this.matches = browser ? window.matchMedia(query).matches : defaultValue;

		$effect(() => {
			const mql = window.matchMedia(this.#query);
			const onChange = () => (this.matches = mql.matches);
			onChange();
			mql.addEventListener('change', onChange);
			return () => mql.removeEventListener('change', onChange);
		});
	}
}
