<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	// PROTOTYPE (#260) — floating variant switcher, dev-only. Delete with the
	// prototype. Deliberately loud (solid ink pill + shadow) so it never reads
	// as part of the design under review.
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CaretLeftIcon from '~icons/ph/caret-left';
	import CaretRightIcon from '~icons/ph/caret-right';
	import MoonStarsIcon from '~icons/ph/moon-stars';

	let {
		current,
		variants
	}: {
		current: string;
		variants: { key: string; name: string }[];
	} = $props();

	const index = $derived(
		Math.max(
			0,
			variants.findIndex((v) => v.key === current)
		)
	);

	function cycle(delta: number) {
		const next = variants[(index + delta + variants.length) % variants.length];
		const url = new URL(page.url);
		url.searchParams.set('variant', next.key);
		goto(url, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, select, [contenteditable]')) return;
		cycle(event.key === 'ArrowLeft' ? -1 : 1);
	}

	// Review both modes without a trip to settings: force-toggle the theme
	// class on <html> (ADR-0010 tokens carry the rest).
	function toggleMode() {
		const root = document.documentElement;
		const isDark =
			root.classList.contains('dark') ||
			(!root.classList.contains('light') &&
				window.matchMedia('(prefers-color-scheme: dark)').matches);
		root.classList.toggle('dark', !isDark);
		root.classList.toggle('light', isDark);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-foreground p-1 text-background shadow-lg"
>
	<button
		type="button"
		aria-label="Previous variant"
		class="rounded-full p-2 hover:cursor-pointer hover:bg-background/20"
		onclick={() => cycle(-1)}
	>
		<CaretLeftIcon class="size-4" />
	</button>

	<span class="min-w-44 text-center text-sm font-medium">
		{variants[index].key} — {variants[index].name}
	</span>

	<button
		type="button"
		aria-label="Next variant"
		class="rounded-full p-2 hover:cursor-pointer hover:bg-background/20"
		onclick={() => cycle(1)}
	>
		<CaretRightIcon class="size-4" />
	</button>

	<button
		type="button"
		aria-label="Toggle color mode"
		class="rounded-full p-2 hover:cursor-pointer hover:bg-background/20"
		onclick={toggleMode}
	>
		<MoonStarsIcon class="size-4" />
	</button>
</div>
