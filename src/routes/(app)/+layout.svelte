<script lang="ts">
	import { setUserContext } from '$lib/utils/user-context.svelte';

	import type { LayoutProps } from './$types';

	import Invitation from './invitation.svelte';
	import Navigation from './navigation.svelte';

	let { children, data }: LayoutProps = $props();

	setUserContext(() => data.user);
</script>

<div class="mx-auto flex w-full max-w-9xl grow gap-2">
	<Navigation budgets={data.budgets} user={data.user}>
		{#snippet invitations()}
			{#each data.invitations as invitation (invitation.budgetId)}
				<Invitation {invitation} />
			{/each}
		{/snippet}
	</Navigation>

	<div class="flex grow flex-col border-l border-muted/20">{@render children()}</div>
</div>
