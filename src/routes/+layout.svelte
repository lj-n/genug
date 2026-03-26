<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Sidebar } from '$lib/components/sidebar';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="mx-auto flex w-full max-w-7xl grow gap-8">
	<Sidebar />

	<div class="flex grow flex-col">
		{@render children()}
	</div>
</div>
