<!--
	PROTOTYPE (#256) — throwaway, delete when the ticket closes.

	Floating switcher that applies base16 schemes from the full tinted-theming
	catalog as live overrides of the 10 semantic tokens in layout.css. Light and
	dark schemes are picked independently (`?light=` / `?dark=`, `current` = no
	override, i.e. today's tokens); the mode pill forces light/dark/auto; arrows
	and ←/→ cycle the Popular list for whichever mode is showing. The ? button
	opens a legend: token → base16 slot → resolved hex → where it appears in the
	app. Injected rules out-specify layout.css (`:root.light` beats `.light`) so
	the existing theme mechanism keeps working underneath.
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

	let lightSlug = $state(page.url.searchParams.get('light') ?? 'current');
	let darkSlug = $state(page.url.searchParams.get('dark') ?? 'current');
	let mode = $state<'auto' | 'dark' | 'light'>(
		browser && document.documentElement.classList.contains('dark')
			? 'dark'
			: browser && document.documentElement.classList.contains('light')
				? 'light'
				: 'auto'
	);
	let legendOpen = $state(false);

	const lightScheme = $derived(schemeBySlug(lightSlug));
	const darkScheme = $derived(schemeBySlug(darkSlug));

	const decl = (tokens: Record<string, string>) =>
		Object.entries(tokens)
			.map(([k, v]) => `${k}: ${v};`)
			.join(' ');

	const css = $derived(
		[
			lightScheme &&
				`@media (prefers-color-scheme: light) { :root:not(.dark) { ${decl(toTokens(lightScheme))} } }
:root.light { ${decl(toTokens(lightScheme))} }`,
			darkScheme &&
				`@media (prefers-color-scheme: dark) { :root:not(.light) { ${decl(toTokens(darkScheme))} } }
:root.dark { ${decl(toTokens(darkScheme))} }`
		]
			.filter(Boolean)
			.join('\n')
	);

	/** Resolved token values per side, for the legend swatches. */
	const resolved = $derived({
		dark: darkScheme ? toTokens(darkScheme) : currentTokens.dark,
		light: lightScheme ? toTokens(lightScheme) : currentTokens.light
	});

	function syncUrl() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- prototype-only, same-page query params
		replaceState(`?light=${lightSlug}&dark=${darkSlug}`, {});
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
		const next = ring[(Math.max(i, 0) + dir + ring.length) % ring.length];
		if (side === 'light') lightSlug = next;
		else darkSlug = next;
		syncUrl();
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

<div class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
	{#if legendOpen}
		<div
			class="max-h-[60vh] overflow-auto rounded-xl bg-zinc-900 p-4 font-sans text-xs text-zinc-50 shadow-lg ring-1 ring-white/20"
		>
			<table class="border-separate border-spacing-x-3 border-spacing-y-1">
				<thead class="text-left text-[10px] tracking-wider text-zinc-400 uppercase">
					<tr><th>token</th><th>slot</th><th>light</th><th>dark</th><th>used for</th></tr>
				</thead>
				<tbody>
					{#each TOKEN_MAP as { slot, token, usage } (token)}
						<tr>
							<td class="font-mono">{token.replace('--color-', '')}</td>
							<td class="font-mono text-zinc-400">{slot}</td>
							<td class="font-mono">
								<span
									class="mr-1 inline-block size-3 rounded-xs align-[-2px] ring-1 ring-white/30"
									style="background: {resolved.light[token]}"
								></span>{resolved.light[token]}
							</td>
							<td class="font-mono">
								<span
									class="mr-1 inline-block size-3 rounded-xs align-[-2px] ring-1 ring-white/30"
									style="background: {resolved.dark[token]}"
								></span>{resolved.dark[token]}
							</td>
							<td class="text-zinc-300">{usage}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-2 max-w-xl text-zinc-400">
				Slot semantics follow the base16 terminal convention: base08 = ANSI red (errors), base0B =
				ANSI green (ok/strings), base0D = ANSI blue (actions/functions), base0C = cyan (info),
				base09 = orange, base00–03 = background ramp, base05 = default foreground.
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
					onchange={(e) => {
						const v = e.currentTarget.value;
						if (side === 'light') lightSlug = v;
						else darkSlug = v;
						syncUrl();
					}}
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
			class:bg-zinc-700={legendOpen}
			onclick={() => (legendOpen = !legendOpen)}
			aria-label="Toggle token legend"
		>
			?
		</button>
	</div>
</div>
