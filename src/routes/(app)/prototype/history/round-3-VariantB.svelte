<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	// PROTOTYPE (#260) — Round 3, Variant B "Rail · tinted pill + slabs":
	// each budget and its accounts sit together on a bordered bg-surface slab
	// (the drawer idiom); active = tinted bg-info/10 pill; drag handles reveal
	// on hover. Delete with the prototype.
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Logo } from '$lib/components/ui/logo';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { signout } from '$lib/remote-functions/auth.remote';
	import { getBudgets } from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { cn } from 'tailwind-variants';
	import DotsSixVerticalIcon from '~icons/ph/dots-six-vertical';
	import GearSixIcon from '~icons/ph/gear-six';
	import PlusIcon from '~icons/ph/plus';
	import SignOutIcon from '~icons/ph/sign-out';
	import WrenchIcon from '~icons/ph/wrench';

	let { children, invitations }: { children: Snippet; invitations: Snippet } = $props();

	type RailItemProps = {
		href: string;
		isActive?: boolean;
		label: string;
		sub?: boolean;
	};

	const budgets = $derived(await getBudgets());
	const user = $derived(await getUser());

	const railRow = (isActive: boolean, sub: boolean) =>
		cn(
			'group flex items-center rounded-md text-sm text-muted transition-colors hover:bg-muted/5 hover:text-foreground',
			sub && 'ml-2',
			isActive && 'bg-info/10 font-medium text-info hover:bg-info/10 hover:text-info'
		);

	const utilItem =
		'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-muted/5 hover:text-foreground';
</script>

{#snippet navitem({ href, isActive = false, label, sub = false }: RailItemProps)}
	<div class={railRow(isActive, sub)}>
		<a {href} class="min-w-0 grow truncate px-3 py-1.5">{label}</a>

		<!-- Visual-only in the prototype: shows where reorder lives. -->
		<button
			type="button"
			aria-label={m.drag_handle_label()}
			title={m.drag_handle_label()}
			class="mr-1 shrink-0 cursor-grab rounded-sm p-0.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
		>
			<DotsSixVerticalIcon class="size-4 text-muted" />
		</button>
	</div>
{/snippet}

<div class="mx-auto flex w-full max-w-9xl grow gap-2">
	<nav class="sticky top-8 hidden w-full max-w-56 flex-col self-start p-4 @7xl/main:flex">
		<Logo href={resolve('/')} class="text-2xl" />

		{@render invitations?.()}

		<div class="mt-8 flex flex-col gap-2">
			<span class="px-3 text-xs tracking-wider text-muted uppercase">Budgets</span>

			{#each budgets as budget (budget.id)}
				<div class="flex flex-col gap-0.5 rounded-md border border-muted/20 bg-surface p-1">
					{@render navitem({
						href: resolve('/(app)/[budgetId=id]', { budgetId: budget.id }),
						isActive: isCurrentPage(page, budget.id),
						label: budget.name
					})}

					{#each await getAccounts(budget.id) as account (account.id)}
						{@render navitem({
							href: resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
								accountId: account.id,
								budgetId: budget.id
							}),
							isActive: isCurrentPage(page, account.id),
							label: account.name,
							sub: true
						})}
					{/each}
				</div>
			{/each}
		</div>

		<div class="mt-8 flex flex-col gap-0.5 border-t border-muted/20 pt-3">
			<a
				href={resolve('/(app)/new')}
				class={cn(utilItem, isCurrentPage(page, 'new') && 'bg-info/10 font-medium text-info')}
			>
				<PlusIcon class="size-4" aria-hidden="true" />
				{m.budget_create_button()}
			</a>

			<a
				href={resolve('/(app)/settings')}
				class={cn(utilItem, isCurrentPage(page, 'settings') && 'bg-info/10 font-medium text-info')}
			>
				<GearSixIcon class="size-4" aria-hidden="true" />
				{m.settings_title()}
			</a>

			{#if user.isAdmin}
				<a
					href={resolve('/(app)/admin')}
					class={cn(utilItem, isCurrentPage(page, 'admin') && 'bg-info/10 font-medium text-info')}
				>
					<WrenchIcon class="size-4" aria-hidden="true" />
					{m.admin_settings_title()}
				</a>
			{/if}

			<form {...signout.for('proto-shell-b')} class="contents">
				<button type="submit" class={cn(utilItem, 'hover:cursor-pointer')}>
					<SignOutIcon class="size-4" aria-hidden="true" />
					{m.sign_out_button({ username: user.username })}
				</button>
			</form>
		</div>
	</nav>

	<div class="flex grow flex-col border-muted/20 @7xl/main:border-l">{@render children()}</div>
</div>
