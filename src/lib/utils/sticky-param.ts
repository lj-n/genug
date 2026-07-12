/**
 * Wraps a reactive getter that may transiently yield `undefined` — such as a
 * route param during client-side navigation teardown, when SvelteKit's
 * `params` briefly reflects the target route while the old page is still
 * mounted — and returns the last defined value while the source is nullish.
 *
 * This keeps remote queries from firing with `undefined` args mid-navigation
 * (the 400 + `Remote function schema validation failed` class). Reading the
 * wrapped getter inside a reactive scope still tracks the source, so consumers
 * re-run when the param actually changes. See ADR-0006.
 */
export function stickyParam<T>(get: () => T | undefined): () => T {
	let last: T | undefined;
	return () => {
		const value = get();
		if (value != null) last = value;
		return last as T;
	};
}
