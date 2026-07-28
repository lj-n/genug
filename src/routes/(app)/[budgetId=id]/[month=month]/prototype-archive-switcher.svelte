<script lang="ts">
	// PROTOTYPE (#334) — throwaway. Floating bottom bar cycling the archive
	// popover variants via `?variant=`. Dev-only.
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const VARIANTS = [
		{ key: 'A', name: 'Labeled button' },
		{ key: 'B', name: 'Row press' },
		{ key: 'C', name: 'Text link' }
	];

	const current = $derived(page.url.searchParams.get('variant')?.toUpperCase() ?? 'A');
	const index = $derived(
		Math.max(
			0,
			VARIANTS.findIndex((v) => v.key === current)
		)
	);

	function go(step: number) {
		const next = VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length];
		const url = new URL(page.url);
		url.searchParams.set('variant', next.key);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- same-page param swap in throwaway prototype
		goto(url, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function onKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, [contenteditable]')) return;
		if (event.key === 'ArrowLeft') go(-1);
		if (event.key === 'ArrowRight') go(1);
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if import.meta.env.DEV}
	<div
		class="fixed bottom-4 left-1/2 z-100 flex -translate-x-1/2 items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-sm text-background shadow-lg"
	>
		<button
			type="button"
			class="cursor-pointer px-1.5"
			onclick={() => go(-1)}
			aria-label="Previous variant"
		>
			←
		</button>
		<span class="min-w-36 text-center font-medium">
			{VARIANTS[index].key} — {VARIANTS[index].name}
		</span>
		<button
			type="button"
			class="cursor-pointer px-1.5"
			onclick={() => go(1)}
			aria-label="Next variant"
		>
			→
		</button>
	</div>
{/if}
