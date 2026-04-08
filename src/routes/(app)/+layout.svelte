<script lang="ts">
	import { Sidebar } from '$lib/components/sidebar';
	import { Button } from '$lib/components/ui/button';
	import PhSignOut from '~icons/ph/sign-out';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<div class="mx-auto flex w-full max-w-9xl grow gap-8">
	<nav class="sticky top-8 flex w-86 flex-col self-start p-2">
		<Sidebar budgets={data.budgets} />

		{#if data.user}
			<form action="/login?/logout" method="post" class="contents">
				<Button type="submit" variant="link"><PhSignOut />Sign out</Button>
			</form>
		{/if}
	</nav>

	<div class="flex grow flex-col">{@render children()}</div>
</div>
