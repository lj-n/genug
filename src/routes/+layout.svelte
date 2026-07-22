<script lang="ts">
	import { dev } from '$app/environment';

	import './layout.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/toaster';

	import type { LayoutProps } from './$types';

	// PROTOTYPE (#256) — remove with the palette prototype files.
	import PalettePrototype from './palette-prototype.svelte';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{dev ? 'DEV_GENUG_DEV' : (page.data.title ?? 'genug')}</title>
</svelte:head>

{@render children()}

{#if dev}
	<!-- PROTOTYPE (#256) — remove with the palette prototype files. -->
	<PalettePrototype />
{/if}

<Toaster />
