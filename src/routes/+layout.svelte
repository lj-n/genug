<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

{#if data.user}
	<nav class="flex">
		<a href="/team" class="link link-hover">Teams</a>
		<a href="/signout" class="ml-auto link link-hover">logout</a>
	</nav>

	<div class="divider" />
{/if}

<slot />
