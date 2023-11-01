<script lang="ts">
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/breadcrumb.svelte';
	import Feather from '$lib/components/feather.svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

{#if data.user}
	<nav
		class="navbar sticky top-0 z-30 backdrop-blur bg-base-100/80 border-b border-b-neutral-focus"
	>
		<div class="navbar-start">
			<a href="/" class="hover:scale-110 transition-transform">
				<img src="/logo.svg" alt="genug logo" width={100} />
			</a>
		</div>

		<div class="navbar-center">
			<a
				href="/budget"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Budget Page"
				title="Budget"
			>
				<Feather name="sliders" />
			</a>

			<a
				href="/transaction"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Transactions Page"
				title="Transactions"
			>
				<Feather name="credit-card" />
			</a>

			<a
				href="/category"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Categories Page"
				title="Categories"
			>
				<Feather name="folder" />
			</a>

			<a
				href="/account"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Accounts Page"
				title="Accounts"
			>
				<Feather name="layers" />
			</a>

			<a
				href="/team"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Teams Page"
				title="Team"
			>
				<Feather name="users" />
			</a>
		</div>

		<div class="navbar-end">
			<a
				href="/settings"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Settings Page"
			>
				<Feather name="tool" />
			</a>

			<a href="/signout" class="btn btn-ghost btn-circle" aria-label="Sign out">
				<Feather name="log-out" />
			</a>
		</div>
	</nav>
{/if}

<div class="px-2 sm:px-4 pt-8 pb-4 flex-grow flex flex-col">
	{#if $page.data.breadcrumbs}
		<Breadcrumb links={$page.data.breadcrumbs} />
	{/if}
	<slot />
</div>
