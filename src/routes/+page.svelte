<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>👋 Hi there {data.user?.name}!</h1>

<div>content</div>

<style>
	div {
		height: 2000px;
	}
</style>
