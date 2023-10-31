<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

{#if data.user}
	<nav class="navbar">
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
			>
				<Feather name="sliders" />
			</a>

			<a
				href="/transaction"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Transactions Page"
			>
				<Feather name="credit-card" />
			</a>

			<a
				href="/category"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Categories Page"
			>
				<Feather name="folder" />
			</a>

			<a
				href="/account"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Accounts Page"
			>
				<Feather name="layers" />
			</a>

			<a
				href="/team"
				class="btn btn-ghost btn-circle"
				aria-label="Go to Teams Page"
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

<slot />
