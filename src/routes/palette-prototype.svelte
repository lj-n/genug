<!--
	PROTOTYPE (#256) — throwaway, delete when the ticket closes.

	Floating switcher that applies candidate base16 palettes as live overrides
	of the 10 semantic tokens in layout.css. `?variant=` selects the scheme
	(`current` = no override, i.e. today's tokens); the moon/sun button forces
	light/dark/auto so both variants of each scheme can be judged in place.
	Injected rules out-specify layout.css (`:root.light` beats `.light`, etc.)
	so the existing theme mechanism keeps working underneath.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';

	import { type Candidate, candidates, toTokens } from './palette-prototype-schemes';

	const keys = ['current', ...candidates.map((c) => c.key)];

	let current = $state(page.url.searchParams.get('variant') ?? 'current');
	let mode = $state<'auto' | 'dark' | 'light'>(
		browser && document.documentElement.classList.contains('dark')
			? 'dark'
			: browser && document.documentElement.classList.contains('light')
				? 'light'
				: 'auto'
	);

	const active = $derived(candidates.find((c) => c.key === current));
	const label = $derived(
		active ? `${active.key.toUpperCase()} — ${active.name}` : 'Current tokens (baseline)'
	);

	function buildCss(c: Candidate): string {
		const decl = (tokens: Record<string, string>) =>
			Object.entries(tokens)
				.map(([k, v]) => `${k}: ${v};`)
				.join(' ');
		const light = decl(toTokens(c.light));
		const dark = decl(toTokens(c.dark));
		return [
			`@media (prefers-color-scheme: light) { :root:not(.dark) { ${light} } }`,
			`@media (prefers-color-scheme: dark) { :root:not(.light) { ${dark} } }`,
			`:root.light { ${light} }`,
			`:root.dark { ${dark} }`
		].join('\n');
	}

	const css = $derived(active ? buildCss(active) : '');

	function cycle(dir: number) {
		const i = keys.indexOf(current);
		current = keys[(i + dir + keys.length) % keys.length];
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- prototype-only, same-page query param
		replaceState(`?variant=${current}`, {});
	}

	function cycleMode() {
		mode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
	}

	$effect(() => {
		const el = document.documentElement;
		el.classList.remove('light', 'dark');
		if (mode !== 'auto') el.classList.add(mode);
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target;
		if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable]')) {
			return;
		}
		if (e.key === 'ArrowLeft') cycle(-1);
		if (e.key === 'ArrowRight') cycle(1);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- prototype-only, self-authored CSS -->
	{@html `<style>${css}</style>`}
</svelte:head>

<div
	class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-zinc-900 py-1.5 pr-1.5 pl-2 font-sans text-sm text-zinc-50 shadow-lg ring-1 ring-white/20"
>
	<button
		type="button"
		class="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-zinc-700"
		onclick={() => cycle(-1)}
		aria-label="Previous palette"
	>
		&larr;
	</button>
	<span class="min-w-72 text-center font-medium">{label}</span>
	<button
		type="button"
		class="grid size-7 cursor-pointer place-items-center rounded-full hover:bg-zinc-700"
		onclick={() => cycle(1)}
		aria-label="Next palette"
	>
		&rarr;
	</button>
	<button
		type="button"
		class="ml-1 cursor-pointer rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs uppercase hover:bg-zinc-600"
		onclick={cycleMode}
	>
		{mode}
	</button>
</div>
