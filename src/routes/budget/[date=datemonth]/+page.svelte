<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import {
		formatFractionToLocaleCurrency,
		getPercentage
	} from '$lib/components/utils';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head>
	<title>Budget | {data.localDate}</title>
</svelte:head>

<h1 class="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
	Budget for 
	<span class="text-primary">{data.localDate}</span>
</h1>
