<!--
	PROTOTYPE (#354) — throwaway, do not ship.
	Four dark accent-token palettes (info/interactive/success), switchable via
	`?variant=` / ← → keys, applied live over layout.css. Judge in dark mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	const variants = [
		{
			key: 'A',
			name: 'current (fails AA)',
			tokens: { info: '#a97bbb', interactive: '#6d9cb1', success: '#7e9a65' }
		},
		{
			key: 'B',
			name: 'ticket floor (text on surface-high, chip on surface)',
			tokens: { info: '#c091d2', interactive: '#79a9be', success: '#8eab75' }
		},
		{
			key: 'C',
			name: 'safe everywhere (incl. chip on surface-high)',
			tokens: { info: '#d0a0e3', interactive: '#89b9ce', success: '#9dbb84' }
		},
		{
			key: 'D',
			name: 'pastel — harmonized with error/focus',
			tokens: { info: '#dbb8e8', interactive: '#a7cad9', success: '#b5cba3' }
		}
	];

	let index = $state(0);
	const variant = $derived(variants[index]);

	function setIndex(i: number) {
		index = (i + variants.length) % variants.length;
		const key = variants[index].key;
		sessionStorage.setItem('proto-354-variant', key);
		const url = new URL(location.href);
		url.searchParams.set('variant', key);
		history.replaceState(history.state, '', url);
	}

	onMount(() => {
		const wanted =
			new URLSearchParams(location.search).get('variant') ??
			sessionStorage.getItem('proto-354-variant');
		const i = variants.findIndex((v) => v.key === wanted);
		if (i >= 0) index = i;
	});

	function onKeydown(event: KeyboardEvent) {
		const t = event.target as HTMLElement | null;
		if (t && (t.closest('input, textarea, select, [contenteditable]') || t.isContentEditable))
			return;
		if (event.key === 'ArrowLeft') setIndex(index - 1);
		if (event.key === 'ArrowRight') setIndex(index + 1);
	}

	// mirrors layout.css's dark blocks; injected after it, so it wins the cascade.
	// the `.light` re-declaration keeps forced-light mode on the real light tokens.
	const _css = $derived(
		`@media (prefers-color-scheme: dark) { :root {
				--color-info: ${variant.tokens.info};
				--color-interactive: ${variant.tokens.interactive};
				--color-success: ${variant.tokens.success};
			} }
			.light {
				--color-info: #06506f;
				--color-interactive: #442c73;
				--color-success: #3d823d;
			}
			.dark {
				--color-info: ${variant.tokens.info};
				--color-interactive: ${variant.tokens.interactive};
				--color-success: ${variant.tokens.success};
			}`
	);
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class="fixed bottom-3 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-3 py-1.5 font-mono text-xs text-white shadow-lg ring-1 ring-white/30"
>
	<button
		type="button"
		class="cursor-pointer px-1 text-base leading-none"
		onclick={() => setIndex(index - 1)}
		aria-label="previous variant"
	>
		←
	</button>
	<span>
		<strong>{variant.key}</strong> — {variant.name}
		<span class="opacity-60">
			({variant.tokens.info} / {variant.tokens.interactive} / {variant.tokens.success})
		</span>
	</span>
	<button
		type="button"
		class="cursor-pointer px-1 text-base leading-none"
		onclick={() => setIndex(index + 1)}
		aria-label="next variant"
	>
		→
	</button>
</div>
