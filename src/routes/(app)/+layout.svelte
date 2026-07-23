<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { getInvitations } from '$lib/remote-functions/budget.remote';

	import type { LayoutProps } from './$types';

	import Invitation from './invitation.svelte';
	import NavigationMobile from './navigation-mobile.svelte';
	import Navigation from './navigation.svelte';
	// PROTOTYPE (#260) — shell variants + switcher; delete with the prototype.
	import PrototypeSwitcher from './prototype/prototype-switcher.svelte';
	import ShellVariantA from './prototype/shell-variant-a.svelte';
	import ShellVariantB from './prototype/shell-variant-b.svelte';
	import ShellVariantC from './prototype/shell-variant-c.svelte';

	let { children }: LayoutProps = $props();

	const allInviations = $derived(await getInvitations());

	// PROTOTYPE (#260): ?variant= picks a shell; sessionStorage keeps the pick
	// across in-app navigations (links don't carry the param). Read in an
	// effect so hydration matches the server render. Dev-only.
	const shellVariants = [
		{ key: 'current', name: 'Current shell' },
		{ key: 'A', name: 'Rail · color marker' },
		{ key: 'B', name: 'Rail · tinted pill' },
		{ key: 'C', name: 'Rail · text + dot' }
	];
	const variantParam = $derived(page.url.searchParams.get('variant'));
	let storedVariant = $state<null | string>(null);
	const variant = $derived(dev ? (variantParam ?? storedVariant ?? 'current') : 'current');
	$effect(() => {
		if (variantParam) sessionStorage.setItem('proto-shell-variant', variantParam);
		storedVariant = variantParam ?? sessionStorage.getItem('proto-shell-variant');
	});
</script>

{#snippet invitationList()}
	{#each allInviations as invitation (invitation.budgetId)}
		<Invitation {invitation} />
	{/each}
{/snippet}

<div class="@container/main flex w-full grow flex-col">
	<NavigationMobile invitations={invitationList} />

	{#if variant === 'A'}
		<ShellVariantA invitations={invitationList}>{@render children()}</ShellVariantA>
	{:else if variant === 'B'}
		<ShellVariantB invitations={invitationList}>{@render children()}</ShellVariantB>
	{:else if variant === 'C'}
		<ShellVariantC invitations={invitationList}>{@render children()}</ShellVariantC>
	{:else}
		<div class="mx-auto flex w-full max-w-9xl grow gap-2">
			<Navigation invitations={invitationList} />

			<div class="flex grow flex-col border-muted/20 @7xl/main:border-l">{@render children()}</div>
		</div>
	{/if}

	{#if dev}
		<PrototypeSwitcher current={variant} variants={shellVariants} />
	{/if}
</div>
