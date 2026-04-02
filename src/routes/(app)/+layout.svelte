<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import PhSignOut from '~icons/ph/sign-out';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<div class="mx-auto flex w-full max-w-9xl grow gap-8">
	<nav class="sticky top-8 flex w-72 flex-col self-start p-2">
		{#each data.budgets.entries() as [budgetId, budget] (budgetId)}
			<div class="grid space-y-2">
				<a href={resolve(`/${budgetId}`)} class="px-3 text-sm font-semibold">{budget.name}</a>
				<div class="grid space-y-1">
					{#each budget.accounts as account (account.id)}
						<a
							href={resolve(`/${budgetId}/accounts/${account.id}`)}
							class="block rounded-md px-3 py-2 text-sm"
						>
							{account.name}
						</a>
					{/each}
				</div>
			</div>
		{/each}

		{#if data.user}
			<form action="/login?/logout" method="post" class="contents">
				<Button type="submit" variant="link"><PhSignOut />Sign out</Button>
			</form>
		{/if}
	</nav>

	<div class="flex grow flex-col">{@render children()}</div>
</div>
