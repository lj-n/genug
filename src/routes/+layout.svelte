<script lang="ts">
	import type { LayoutData } from './$types';
	import Navigation from './navigation.svelte';

	// import '../styles/fonts.css';
	// import '../styles/base.css';
	// import '../styles/components.css';
	import '@unocss/reset/tailwind.css'
	import 'virtual:uno.css'

	export let data: LayoutData;
</script>

{#if data.user}
	<Navigation />
{/if}

<slot />
