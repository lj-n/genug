<script lang="ts">
	import { page } from '$app/state';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button';
	import PhSignOut from '~icons/ph/sign-out';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{page.data.title ?? 'genug'}</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl grow gap-8">
	{#if data.session}
		<form action="/login?/logout" method="post" class="contents">
			<Button type="submit" variant="link"><PhSignOut />Sign out</Button>
		</form>
	{/if}

	<div class="flex grow flex-col">{@render children()}</div>
</div>
