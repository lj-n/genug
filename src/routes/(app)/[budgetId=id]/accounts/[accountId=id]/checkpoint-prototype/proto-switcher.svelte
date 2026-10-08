<!-- PROTOTYPE — floating variant switcher. Dev only; not part of any variant. -->
<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let {
		extras = [],
		labels
	}: {
		/** Extra URL params to tweak, each with its choices (first = default). */
		extras?: { label: string; param: string; values: string[] }[];
		labels: Record<string, string>;
	} = $props();

	const keys = $derived(Object.keys(labels));
	const current = $derived(page.url.searchParams.get('variant') ?? keys[0]);
	const noCheckpoint = $derived(page.url.searchParams.get('cp') === 'none');

	function setParam(name: string, value: null | string) {
		const url = new URL(page.url);
		if (value === null) url.searchParams.delete(name);
		else url.searchParams.set(name, value);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(url, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function cycle(step: number) {
		const i = keys.indexOf(current);
		setParam('variant', keys[(i + step + keys.length) % keys.length]);
	}

	function onkeydown(e: KeyboardEvent) {
		const t = e.target as HTMLElement;
		if (t.closest('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowLeft') cycle(-1);
		if (e.key === 'ArrowRight') cycle(1);
	}
</script>

<svelte:window {onkeydown} />

{#if dev}
	<div
		class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-foreground px-4 py-2 text-sm whitespace-nowrap text-background shadow-lg"
	>
		<button type="button" onclick={() => cycle(-1)} aria-label="Previous variant">◀</button>
		<span class="font-mono">{current} ({labels[current]})</span>
		<button type="button" onclick={() => cycle(1)} aria-label="Next variant">▶</button>
		{#each extras as extra (extra.param)}
			<span class="opacity-40">|</span>
			<label class="flex items-center gap-1">
				{extra.label}
				<select
					class="rounded-sm bg-background px-1 text-foreground"
					value={page.url.searchParams.get(extra.param) ?? extra.values[0]}
					onchange={(e) =>
						setParam(
							extra.param,
							e.currentTarget.value === extra.values[0] ? null : e.currentTarget.value
						)}
				>
					{#each extra.values as value (value)}<option {value}>{value}</option>{/each}
				</select>
			</label>
		{/each}
		<span class="opacity-40">|</span>
		<label class="flex items-center gap-1">
			<input
				type="checkbox"
				checked={noCheckpoint}
				onchange={(e) => setParam('cp', e.currentTarget.checked ? 'none' : null)}
			/>
			no checkpoint yet
		</label>
	</div>
{/if}
