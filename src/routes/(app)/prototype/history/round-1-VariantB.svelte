<script lang="ts">
	// PROTOTYPE (#260) — Variant B "Top bar": chrome collapses to a 48px
	// hairline-bottom app bar; budgets are quiet tabs opening a dropdown
	// (overview + accounts); utilities are muted icon buttons on the right.
	// Content gets the full width below. Delete with the prototype.
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { signout } from '$lib/remote-functions/auth.remote';
	import { getBudgets } from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { cn } from 'tailwind-variants';
	import CaretDownIcon from '~icons/ph/caret-down';
	import GearSixIcon from '~icons/ph/gear-six';
	import PlusIcon from '~icons/ph/plus';
	import SignOutIcon from '~icons/ph/sign-out';
	import WrenchIcon from '~icons/ph/wrench';

	let { children, invitations }: { children: Snippet; invitations: Snippet } = $props();

	const budgets = $derived(await getBudgets());
	const user = $derived(await getUser());
</script>

<header
	class="sticky top-0 z-30 hidden h-12 w-full items-center gap-4 border-b border-muted/20 bg-background px-4 @7xl/main:flex"
>
	<a href={resolve('/')} class="flex shrink-0 items-center gap-2">
		<img src={favicon} alt="" class="size-6 [image-rendering:pixelated]" />
		<span class="font-slab text-lg leading-none font-bold text-success">genug</span>
	</a>

	<nav class="no-scrollbar flex h-full min-w-0 items-center overflow-x-auto">
		{#each budgets as budget (budget.id)}
			{@const isActive = page.params.budgetId === budget.id}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={cn(
						'flex h-full shrink-0 items-center gap-1 border-b-2 border-transparent px-3 text-sm text-muted transition-colors hover:cursor-pointer hover:text-foreground',
						isActive && 'border-foreground font-medium text-foreground'
					)}
				>
					{budget.name}
					<CaretDownIcon class="size-3 text-muted" aria-hidden="true" />
				</DropdownMenu.Trigger>

				<DropdownMenu.Content align="start" class="min-w-48">
					<DropdownMenu.Item>
						{#snippet child({ props })}
							<a href={resolve('/(app)/[budgetId=id]', { budgetId: budget.id })} {...props}>
								{budget.name}
							</a>
						{/snippet}
					</DropdownMenu.Item>

					<DropdownMenu.Separator />

					{#each await getAccounts(budget.id) as account (account.id)}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a
									href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
										accountId: account.id,
										budgetId: budget.id
									})}
									{...props}
									class={cn(
										props.class as string,
										isCurrentPage(page, account.id) && 'font-medium'
									)}
								>
									{account.name}
								</a>
							{/snippet}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/each}
	</nav>

	<div class="ml-auto flex shrink-0 items-center gap-1">
		<Button href={resolve('/(app)/new')} size="icon" variant="ghost" class="text-muted">
			<span class="sr-only">{m.budget_create_button()}</span>
			<PlusIcon class="size-5" />
		</Button>

		<Button href={resolve('/(app)/settings')} size="icon" variant="ghost" class="text-muted">
			<span class="sr-only">{m.settings_title()}</span>
			<GearSixIcon class="size-5" />
		</Button>

		{#if user.isAdmin}
			<Button href={resolve('/(app)/admin')} size="icon" variant="ghost" class="text-muted">
				<span class="sr-only">{m.admin_settings_title()}</span>
				<WrenchIcon class="size-5" />
			</Button>
		{/if}

		<form {...signout.for('proto-shell-b')} class="contents">
			<Button type="submit" size="icon" variant="ghost" class="text-muted">
				<span class="sr-only">{m.sign_out_button({ username: user.username })}</span>
				<SignOutIcon class="size-5" />
			</Button>
		</form>
	</div>
</header>

<div class="mx-auto flex w-full max-w-8xl grow flex-col">
	<div class="empty:hidden">{@render invitations?.()}</div>
	{@render children()}
</div>
