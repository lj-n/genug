<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>genug</title>
</svelte:head>

<h1>👋 Hi there {data.user?.name}!</h1>
