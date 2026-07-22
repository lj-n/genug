<!--
	PROTOTYPE (#256) — throwaway, delete when the ticket closes.

	Floating palette workbench. Schemes from the tinted-theming catalog are
	starting points only: picking one (selects, arrows, ←/→) loads its values
	into the 10 semantic tokens for that side; the ? panel then lets every token
	be fine-tuned per mode with a color picker + hex field, applied live, with a
	contrast readout vs the background token. State is URL-encoded
	(`?light=&dark=` slugs + `tl=`/`td=` comma-joined tuned hexes) so it is
	reload-stable and shareable. The mode pill forces light/dark/auto. Injected
	rules out-specify layout.css (`:root.light` beats `.light`) so the existing
	theme mechanism keeps working underneath.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';

	import {
		currentTokens,
		personalOf,
		popularOf,
		restOf,
		schemeBySlug,
		TOKEN_MAP,
		toTokens
	} from './palette-prototype-schemes';

	const tokens = TOKEN_MAP.map((t) => t.token);

	function schemeTokens(side: 'dark' | 'light', slug: string): Record<string, string> {
		const scheme = schemeBySlug(slug);
		return scheme ? toTokens(scheme) : { ...currentTokens[side] };
	}

	function parseTuned(param: null | string): null | string[] {
		if (!param) return null;
		const parts = param.split(',');
		if (parts.length !== tokens.length || parts.some((p) => !/^[0-9a-f]{6}$/i.test(p))) {
			return null;
		}
		return parts.map((p) => `#${p.toLowerCase()}`);
	}

	function initSide(side: 'dark' | 'light', slug: string, param: null | string) {
		const tuned = parseTuned(param);
		if (tuned) return Object.fromEntries(tokens.map((t, i) => [t, tuned[i]]));
		return schemeTokens(side, slug);
	}

	let lightSlug = $state(page.url.searchParams.get('light') ?? 'current');
	let darkSlug = $state(page.url.searchParams.get('dark') ?? 'current');
	let lightTokens = $state(initSide('light', lightSlug, page.url.searchParams.get('tl')));
	let darkTokens = $state(initSide('dark', darkSlug, page.url.searchParams.get('td')));
	let mode = $state<'auto' | 'dark' | 'light'>(
		browser && document.documentElement.classList.contains('dark')
			? 'dark'
			: browser && document.documentElement.classList.contains('light')
				? 'light'
				: 'auto'
	);
	let panelOpen = $state(false);

	const decl = (t: Record<string, string>) =>
		Object.entries(t)
			.map(([k, v]) => `${k}: ${v};`)
			.join(' ');

	const css = $derived(
		`@media (prefers-color-scheme: light) { :root:not(.dark) { ${decl(lightTokens)} } }
:root.light { ${decl(lightTokens)} }
@media (prefers-color-scheme: dark) { :root:not(.light) { ${decl(darkTokens)} } }
:root.dark { ${decl(darkTokens)} }`
	);

	function syncUrl() {
		const tl = tokens.map((t) => lightTokens[t].slice(1)).join(',');
		const td = tokens.map((t) => darkTokens[t].slice(1)).join(',');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- prototype-only, same-page query params
		replaceState(`?light=${lightSlug}&dark=${darkSlug}&tl=${tl}&td=${td}`, {});
	}

	function loadScheme(side: 'dark' | 'light', slug: string) {
		if (side === 'light') {
			lightSlug = slug;
			lightTokens = schemeTokens('light', slug);
		} else {
			darkSlug = slug;
			darkTokens = schemeTokens('dark', slug);
		}
		syncUrl();
	}

	function effectiveMode(): 'dark' | 'light' {
		if (mode !== 'auto') return mode;
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function cycle(dir: number) {
		const side = effectiveMode();
		const ring = [
			'current',
			...personalOf(side).map((s) => s.slug),
			...popularOf(side).map((s) => s.slug)
		];
		const slug = side === 'light' ? lightSlug : darkSlug;
		const i = ring.indexOf(slug);
		loadScheme(side, ring[(Math.max(i, 0) + dir + ring.length) % ring.length]);
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

	// --- contrast readout ---
	const luminance = (hex: string) => {
		const c = [1, 3, 5]
			.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
			.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
		return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
	};
	function contrast(a: string, b: string): number {
		const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return (l1 + 0.05) / (l2 + 0.05);
	}
	function crClass(r: number): string {
		return r >= 4.5 ? 'text-emerald-400' : r >= 3 ? 'text-amber-400' : 'text-red-400';
	}

	/** Fills, not text — a contrast-vs-background readout would be noise. */
	const noContrast = new Set(['--color-background', '--color-surface', '--color-surface-high']);

	function onHexInput(side: 'dark' | 'light', token: string, value: string) {
		if (!/^#[0-9a-f]{6}$/i.test(value)) return;
		if (side === 'light') lightTokens[token] = value.toLowerCase();
		else darkTokens[token] = value.toLowerCase();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- prototype-only, self-authored CSS -->
	{@html `<style>${css}</style>`}
</svelte:head>

<div class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
	{#if panelOpen}
		<div
			class="max-h-[70vh] overflow-auto rounded-xl bg-zinc-900 p-4 font-sans text-xs text-zinc-50 shadow-lg ring-1 ring-white/20"
		>
			<table class="border-separate border-spacing-x-3 border-spacing-y-1">
				<thead class="text-left text-[10px] tracking-wider text-zinc-400 uppercase">
					<tr>
						<th>token</th>
						<th>☀ light</th>
						<th>vs bg</th>
						<th>☾ dark</th>
						<th>vs bg</th>
						<th>used for</th>
					</tr>
				</thead>
				<tbody>
					{#each TOKEN_MAP as { token, usage } (token)}
						{@const short = token.replace('--color-', '')}
						<tr>
							<td class="font-mono">{short}</td>
							{#each [{ side: 'dark' as const }, { side: 'light' as const }].reverse() as { side } (side)}
								{@const vals = side === 'light' ? lightTokens : darkTokens}
								<td>
									<span class="flex items-center gap-1">
										<input
											type="color"
											aria-label="{short} {side}"
											class="size-5 shrink-0 cursor-pointer rounded-xs bg-transparent"
											value={vals[token]}
											oninput={(e) => onHexInput(side, token, e.currentTarget.value)}
											onchange={syncUrl}
										/>
										<input
											type="text"
											aria-label="{short} {side} hex"
											class="w-18 rounded-sm bg-zinc-800 px-1 py-0.5 font-mono"
											value={vals[token]}
											oninput={(e) => onHexInput(side, token, e.currentTarget.value)}
											onchange={syncUrl}
										/>
									</span>
								</td>
								<td
									class="font-mono {noContrast.has(token)
										? 'text-zinc-500'
										: crClass(contrast(vals[token], vals['--color-background']))}"
								>
									{noContrast.has(token)
										? '—'
										: contrast(vals[token], vals['--color-background']).toFixed(1)}
								</td>
							{/each}
							<td class="text-zinc-300">{usage}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-2 max-w-2xl text-zinc-400">
				Pickers apply live to the mode you are viewing (toggle with the pill). Contrast is vs the
				background token: <span class="text-emerald-400">≥4.5 AA text</span>,
				<span class="text-amber-400">≥3 large text/graphics</span>,
				<span class="text-red-400">below 3</span>. Selecting a scheme resets that side to its
				values.
			</p>
		</div>
	{/if}

	<div
		class="flex items-center gap-1.5 rounded-full bg-zinc-900 py-1.5 pr-1.5 pl-2 font-sans text-sm text-zinc-50 shadow-lg ring-1 ring-white/20"
	>
		<button
			type="button"
			class="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-zinc-700"
			onclick={() => cycle(-1)}
			aria-label="Previous popular scheme"
		>
			&larr;
		</button>
		<button
			type="button"
			class="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-zinc-700"
			onclick={() => cycle(1)}
			aria-label="Next popular scheme"
		>
			&rarr;
		</button>

		{#each [{ icon: '☀', side: 'light' }, { icon: '☾', side: 'dark' }] as const as { icon, side } (side)}
			<label class="flex items-center gap-1">
				<span aria-hidden="true">{icon}</span>
				<select
					aria-label="{side} scheme"
					class="max-w-44 cursor-pointer rounded-md bg-zinc-800 px-1.5 py-1 text-xs"
					value={side === 'light' ? lightSlug : darkSlug}
					onchange={(e) => loadScheme(side, e.currentTarget.value)}
				>
					<option value="current">current tokens</option>
					<optgroup label="Personal">
						{#each personalOf(side) as s (s.slug)}
							<option value={s.slug}>{s.name}</option>
						{/each}
					</optgroup>
					<optgroup label="Popular">
						{#each popularOf(side) as s (s.slug)}
							<option value={s.slug}>{s.name}</option>
						{/each}
					</optgroup>
					<optgroup label="All {side} schemes">
						{#each restOf(side) as s (s.slug)}
							<option value={s.slug}>{s.name}</option>
						{/each}
					</optgroup>
				</select>
			</label>
		{/each}

		<button
			type="button"
			class="cursor-pointer rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs uppercase hover:bg-zinc-600"
			aria-label="Cycle color mode"
			onclick={cycleMode}
		>
			{mode}
		</button>
		<button
			type="button"
			class="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-xs hover:bg-zinc-700"
			class:bg-zinc-700={panelOpen}
			onclick={() => (panelOpen = !panelOpen)}
			aria-label="Toggle tuning panel"
		>
			?
		</button>
	</div>
</div>
