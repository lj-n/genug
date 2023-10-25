<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

{#if data.user}
	<nav class="flex gap-4">
		<a href="/budget">Budgets</a>
		<a href="/account">Accounts</a>
		<a href="/category">Categories</a>
		<a href="/transaction">Transactions</a>
		<a href="/team" class="ml-auto link link-hover">Teams</a>
		<a href="/signout" class="link link-hover">logout</a>
	</nav>

	<div class="divider" />
{/if}

<slot />
