<script lang="ts">
	import type { LayoutData } from './$types';
	import Navigation from './navigation.svelte';

	import '@unocss/reset/tailwind.css';
	import '../fonts.css';
	import 'virtual:uno.css';

	export let data: LayoutData;
</script>

{#if data.user}
	<Navigation userId={data.user.id} />
{/if}

<div class="py-8 flex flex-col">
	<slot />
</div>
