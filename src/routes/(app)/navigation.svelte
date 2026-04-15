<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from '$lib/components/logo.svelte';
	import SideMenu from '$lib/components/side-menu.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { cn } from 'tailwind-variants';
	import PhGearSix from '~icons/ph/gear-six';
	import PhPlus from '~icons/ph/plus';
	import PhSignOut from '~icons/ph/sign-out';
	import PhWrench from '~icons/ph/wrench';

	import type { LayoutData } from './$types';

	let { budgets, user }: { budgets: LayoutData['budgets']; user: LayoutData['user'] } = $props();

	type NavItemProps = {
		href: string;
		icon: Snippet<[isActive: boolean]>;
		isActive: boolean;
		label: string;
	};
</script>

{#snippet plus(isActive: boolean)}
	<PhPlus class={cn('size-6', isActive ? 'text-success' : 'text-muted')} />
{/snippet}

{#snippet gear(isActive: boolean)}
	<PhGearSix class={cn('size-6', isActive ? 'text-info' : 'text-muted')} />
{/snippet}

{#snippet wrench(isActive: boolean)}
	<PhWrench class={cn('size-6', isActive ? 'text-info' : 'text-muted')} />
{/snippet}

{#snippet navitem({ href, icon, isActive, label }: NavItemProps)}
	<a
		{href}
		class={cn(
			'group flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/5',
			isActive && 'bg-info/10 text-info hover:bg-info/15'
		)}
	>
		<div aria-hidden="true">
			{@render icon(isActive)}
		</div>
		{label}
	</a>
{/snippet}

<nav
	class="sticky top-8 flex w-full max-w-80 flex-col gap-2 self-start rounded-md border border-muted/10 bg-surface py-2 shadow-2xs"
>
	<a href={resolve('/')} class="w-fit px-2">
		<Logo class="h-12" />
	</a>

	<Separator orientation="horizontal" />

	<SideMenu {budgets} />

	<Separator orientation="horizontal" />

	<div class="grid space-y-1 px-2">
		{@render navitem({
			href: resolve('/(app)/new'),
			icon: plus,
			isActive: isCurrentPage(page, 'new'),
			label: m.budget_create_button()
		})}

		{@render navitem({
			href: resolve('/(app)/settings'),
			icon: gear,
			isActive: isCurrentPage(page, 'settings'),
			label: m.settings_title()
		})}

		{#if user.isAdmin}
			{@render navitem({
				href: resolve('/(app)/admin'),
				icon: wrench,
				isActive: isCurrentPage(page, 'admin'),
				label: m.admin_settings_title()
			})}
		{/if}

		<form action="/login?/logout" method="post" class="contents">
			<button
				type="submit"
				class="group flex items-center gap-2 rounded-md p-2 transition-colors hover:cursor-pointer hover:bg-muted/5"
			>
				<div aria-hidden="true">
					<PhSignOut class="size-6 text-muted" />
				</div>
				{m.sign_out_button({ username: user.username })}
			</button>
		</form>
	</div>
</nav>
