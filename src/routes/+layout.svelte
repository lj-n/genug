<script lang="ts">
	import type { LayoutData } from './$types';
	import Navigation from './navigation.svelte';

	import '../app.css';

	export let data: LayoutData;
</script>

{#if data.user}
	<Navigation />
{/if}

<slot />
