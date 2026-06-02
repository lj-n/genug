<script lang="ts">
	import { setUserContext } from '$lib/utils/user-context';

	import type { LayoutProps } from './$types';

	import Invitation from './invitation.svelte';
	import NavigationMobile from './navigation-mobile.svelte';
	import Navigation from './navigation.svelte';

	let { children, data }: LayoutProps = $props();

	setUserContext(() => data.user);
</script>

<div class="@container/main mx-auto flex w-full max-w-9xl grow gap-2">
	<NavigationMobile {...data}>
		{#snippet invitations()}
			{#each data.invitations as invitation (invitation.budgetId)}
				<Invitation {invitation} />
			{/each}
		{/snippet}
	</NavigationMobile>

	<Navigation {...data}>
		{#snippet invitations()}
			{#each data.invitations as invitation (invitation.budgetId)}
				<Invitation {invitation} />
			{/each}
		{/snippet}
	</Navigation>

	<div class="flex grow flex-col border-muted/20 @7xl/main:border-l">{@render children()}</div>
</div>
