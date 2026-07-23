<script lang="ts">
	// PROTOTYPE (#260) — Variant C "Inline header": the extreme-quiet take.
	// No persistent chrome surface at all — a single breadcrumb line inside a
	// narrow document column (wordmark / budget ▾ / account ▾, ⋯ menu right).
	// Delete with the prototype.
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { signout } from '$lib/remote-functions/auth.remote';
	import { getBudgets } from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { cn } from 'tailwind-variants';
	import CaretDownIcon from '~icons/ph/caret-down';
	import DotsThreeIcon from '~icons/ph/dots-three';
	import GearSixIcon from '~icons/ph/gear-six';
	import PlusIcon from '~icons/ph/plus';
	import SignOutIcon from '~icons/ph/sign-out';
	import WrenchIcon from '~icons/ph/wrench';

	let { children, invitations }: { children: Snippet; invitations: Snippet } = $props();

	const budgets = $derived(await getBudgets());
	const user = $derived(await getUser());

	const currentBudget = $derived(budgets.find((b) => b.id === page.params.budgetId));
	const accounts = $derived(currentBudget ? await getAccounts(currentBudget.id) : []);
	const currentAccount = $derived(accounts.find((a) => a.id === page.params.accountId));

	const crumbTrigger =
		'flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:cursor-pointer hover:bg-muted/5 hover:text-foreground';
</script>

<div class="mx-auto flex w-full max-w-5xl grow flex-col">
	<header class="hidden h-12 items-center gap-1 px-4 text-sm md:px-8 @7xl/main:flex">
		<a href={resolve('/')} class="flex items-center gap-1.5 rounded-md px-1.5 py-1">
			<img src={favicon} alt="" class="size-4 [image-rendering:pixelated]" />
			<span class="font-slab leading-none font-bold text-success">genug</span>
		</a>

		<span class="text-muted/40" aria-hidden="true">/</span>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(crumbTrigger, currentBudget ? 'font-medium text-foreground' : 'text-muted')}
			>
				{currentBudget?.name ?? 'Budgets'}
				<CaretDownIcon class="size-3 text-muted" aria-hidden="true" />
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" class="min-w-48">
				{#each budgets as budget (budget.id)}
					<DropdownMenu.Item>
						{#snippet child({ props })}
							<a
								href={resolve('/(app)/[budgetId=id]', { budgetId: budget.id })}
								{...props}
								class={cn(props.class as string, budget.id === currentBudget?.id && 'font-medium')}
							>
								{budget.name}
							</a>
						{/snippet}
					</DropdownMenu.Item>
				{/each}

				<DropdownMenu.Separator />

				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a href={resolve('/(app)/new')} {...props}>
							<PlusIcon />
							{m.budget_create_button()}
						</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		{#if currentBudget && accounts.length > 0}
			<span class="text-muted/40" aria-hidden="true">/</span>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={cn(crumbTrigger, currentAccount ? 'font-medium text-foreground' : 'text-muted')}
				>
					{currentAccount?.name ?? m.budget_account_list_accounts_label()}
					<CaretDownIcon class="size-3 text-muted" aria-hidden="true" />
				</DropdownMenu.Trigger>

				<DropdownMenu.Content align="start" class="min-w-48">
					{#each accounts as account (account.id)}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a
									href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
										accountId: account.id,
										budgetId: currentBudget.id
									})}
									{...props}
									class={cn(
										props.class as string,
										account.id === currentAccount?.id && 'font-medium'
									)}
								>
									{account.name}
								</a>
							{/snippet}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}

		<div class="ml-auto">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={cn(crumbTrigger, 'text-muted')}
					aria-label={m.settings_title()}
				>
					<DotsThreeIcon class="size-5" />
				</DropdownMenu.Trigger>

				<DropdownMenu.Content align="end" class="min-w-48">
					<DropdownMenu.Item>
						{#snippet child({ props })}
							<a href={resolve('/(app)/settings')} {...props}>
								<GearSixIcon />
								{m.settings_title()}
							</a>
						{/snippet}
					</DropdownMenu.Item>

					{#if user.isAdmin}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href={resolve('/(app)/admin')} {...props}>
									<WrenchIcon />
									{m.admin_settings_title()}
								</a>
							{/snippet}
						</DropdownMenu.Item>
					{/if}

					<DropdownMenu.Separator />

					<form {...signout.for('proto-shell-c')} class="contents">
						<DropdownMenu.Item closeOnSelect={false}>
							{#snippet child({ props })}
								<button type="submit" {...props} class={cn(props.class as string, 'w-full')}>
									<SignOutIcon />
									{m.sign_out_button({ username: user.username })}
								</button>
							{/snippet}
						</DropdownMenu.Item>
					</form>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</header>

	<div class="empty:hidden">{@render invitations?.()}</div>
	{@render children()}
</div>
