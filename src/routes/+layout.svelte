<script lang="ts">
	import { dev } from '$app/environment';

	import './layout.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{dev ? 'DEV_GENUG_DEV' : (page.data.title ?? 'genug')}</title>
</svelte:head>

{@render children()}
