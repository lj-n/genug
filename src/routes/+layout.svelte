<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
  
	import Breadcrumb from './breadcrumb.svelte';
	import Navigation from './navigation.svelte';

	import '../app.css';

	export let data: LayoutData;
</script>

{#if data.user}
	<Navigation />
{/if}

{#if $page.data.breadcrumbs}
	<Breadcrumb links={$page.data.breadcrumbs} />
{/if}

<slot />
