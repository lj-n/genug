<script lang="ts">
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SideMenu } from '$lib/components/features/side-menu';
	import { Logo } from '$lib/components/ui/logo';
	import { m } from '$lib/paraglide/messages';
	import { signout } from '$lib/remote-functions/auth.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { cn } from 'tailwind-variants';
	import GearSixIcon from '~icons/ph/gear-six';
	import PlusIcon from '~icons/ph/plus';
	import SignOutIcon from '~icons/ph/sign-out';
	import WrenchIcon from '~icons/ph/wrench';

	let {
		invitations
	}: {
		invitations: Snippet;
	} = $props();

	const user = $derived(await getUser());

	const utilItem =
		'flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-muted/5 hover:text-foreground';
</script>

<nav class="sticky top-8 hidden w-full max-w-56 flex-col self-start p-4 @7xl/main:flex">
	<Logo href={resolve('/')} class="text-2xl" />

	{@render invitations?.()}

	<div class="mt-6">
		<SideMenu />
	</div>

	<div class="mt-6 flex flex-col border-t border-muted/20 pt-2">
		<a
			href={resolve('/(app)/new')}
			class={cn(utilItem, isCurrentPage(page, 'new') && 'font-medium text-info')}
		>
			<PlusIcon class="size-4" aria-hidden="true" />
			{m.budget_create_button()}
		</a>

		<a
			href={resolve('/(app)/settings')}
			class={cn(utilItem, isCurrentPage(page, 'settings') && 'font-medium text-info')}
		>
			<GearSixIcon class="size-4" aria-hidden="true" />
			{m.settings_title()}
		</a>

		{#if user.isAdmin}
			<a
				href={resolve('/(app)/admin')}
				class={cn(utilItem, isCurrentPage(page, 'admin') && 'font-medium text-info')}
			>
				<WrenchIcon class="size-4" aria-hidden="true" />
				{m.admin_settings_title()}
			</a>
		{/if}

		<form {...signout.for('desktop-navigation')} class="contents">
			<button type="submit" class={cn(utilItem, 'hover:cursor-pointer')}>
				<SignOutIcon class="size-4" aria-hidden="true" />
				{m.sign_out_button({ username: user.username })}
			</button>
		</form>
	</div>
</nav>
