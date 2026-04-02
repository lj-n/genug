<script lang="ts">
	import { page } from '$app/state';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{page.data.title ?? 'genug'}</title>
</svelte:head>

{@render children()}
