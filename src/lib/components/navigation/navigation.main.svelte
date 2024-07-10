<script lang="ts">
	import { page } from '$app/stores';

	import { cn } from '$lib/utils';
	import type { User } from 'lucia';
	import { NavigationLink } from '.';

	export let user: User | null;
</script>

<nav class="hidden items-center gap-6 text-sm md:flex">
	<a href="/" class="">
		<img src="/logo.svg" alt="genug logo" width={86} />
	</a>

	{#if user}
		<NavigationLink href="/budget">Budget</NavigationLink>
		<NavigationLink href="/transactions">Transactions</NavigationLink>
		<NavigationLink href="/categories">Categories</NavigationLink>
		<NavigationLink href="/accounts">Accounts</NavigationLink>
		<NavigationLink href="/teams">Teams</NavigationLink>
	{/if}
</nav>
