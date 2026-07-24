<script lang="ts">
	import { getInvitations } from '$lib/remote-functions/budget.remote';

	import type { LayoutProps } from './$types';

	import Invitation from './invitation.svelte';
	import NavigationMobile from './navigation-mobile.svelte';
	import Navigation from './navigation.svelte';

	let { children }: LayoutProps = $props();

	const allInviations = $derived(await getInvitations());
</script>

{#snippet invitationList()}
	{#each allInviations as invitation (invitation.budgetId)}
		<Invitation {invitation} />
	{/each}
{/snippet}

<div class="@container/main mx-auto flex w-full max-w-9xl grow gap-2">
	<NavigationMobile invitations={invitationList} />

	<Navigation invitations={invitationList} />

	<div class="flex grow flex-col border-muted/20 @7xl/main:border-l">{@render children()}</div>
</div>
