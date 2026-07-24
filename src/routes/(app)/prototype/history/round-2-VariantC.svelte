<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	// PROTOTYPE (#260) — Round 2, Variant C "Rail · text + dot": the quiet rail
	// where color lives in the typography — active item turns info-colored with
	// a small leading dot, no fills, no bars. Delete with the prototype.
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

	const railItem = (isActive: boolean, sub: boolean) =>
		cn(
			'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-muted/5 hover:text-foreground',
			sub && 'pl-6',
			isActive && 'font-medium text-info hover:text-info'
		);
</script>

{#snippet navitem({ href, isActive = false, label, sub = false }: RailItemProps)}
	<a {href} class={railItem(isActive, sub)}>
		<span
			class={cn('size-1.5 shrink-0 rounded-full', isActive ? 'bg-info' : 'bg-transparent')}
			aria-hidden="true"
		></span>
		{label}
	</a>
{/snippet}

<div class="mx-auto flex w-full max-w-9xl grow gap-2">
	<nav class="sticky top-8 hidden w-full max-w-56 flex-col self-start p-4 @7xl/main:flex">
		<Logo href={resolve('/')} class="text-2xl" />

		{@render invitations?.()}

		<div class="mt-8 flex flex-col gap-5">
			<div class="flex flex-col">
				<span class="px-3 pb-1 text-xs tracking-wider text-muted uppercase">Budgets</span>

				{#each budgets as budget (budget.id)}
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
				{/each}
			</div>
		</div>

		<div class="mt-8 flex flex-col border-t border-muted/20 pt-3">
			<a href={resolve('/(app)/new')} class={railItem(isCurrentPage(page, 'new'), false)}>
				<PlusIcon class="size-4" aria-hidden="true" />
				{m.budget_create_button()}
			</a>

			<a href={resolve('/(app)/settings')} class={railItem(isCurrentPage(page, 'settings'), false)}>
				<GearSixIcon class="size-4" aria-hidden="true" />
				{m.settings_title()}
			</a>

			{#if user.isAdmin}
				<a href={resolve('/(app)/admin')} class={railItem(isCurrentPage(page, 'admin'), false)}>
					<WrenchIcon class="size-4" aria-hidden="true" />
					{m.admin_settings_title()}
				</a>
			{/if}

			<form {...signout.for('proto-shell-c')} class="contents">
				<button type="submit" class={cn(railItem(false, false), 'hover:cursor-pointer')}>
					<SignOutIcon class="size-4" aria-hidden="true" />
					{m.sign_out_button({ username: user.username })}
				</button>
			</form>
		</div>
	</nav>

	<div class="flex grow flex-col border-muted/20 @7xl/main:border-l">{@render children()}</div>
</div>
