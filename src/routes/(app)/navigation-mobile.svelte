<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from '$lib/components/logo.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import { m } from '$lib/paraglide/messages';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { cn } from 'tailwind-variants';
	import ArrowBendDownRightBoldIcon from '~icons/ph/arrow-bend-down-right-bold';
	import GearSixIcon from '~icons/ph/gear-six';
	import ListBoldIcon from '~icons/ph/list-bold';
	import PlusIcon from '~icons/ph/plus';
	import SignOutIcon from '~icons/ph/sign-out';
	import WrenchIcon from '~icons/ph/wrench';

	let {
		accounts,
		budgets: allBudgets,
		invitations,
		user
	}: {
		accounts: App.Account[];
		budgets: App.Budget[];
		invitations: Snippet;
		user: App.User;
	} = $props();

	let budgets = $derived(
		allBudgets.map((b) => ({ ...b, accounts: accounts.filter((f) => f.budgetId === b.id) }))
	);

	let open = $state(false);

	const closeDrawerAttachment: Attachment<HTMLElement> = (node) => {
		function closeDrawer() {
			open = false;
		}

		const links = node.querySelectorAll('a');
		links.forEach((e) => e.addEventListener('click', closeDrawer));
		return () => {
			links.forEach((e) => e.removeEventListener('click', closeDrawer));
		};
	};
</script>

<Drawer.Root bind:open>
	<Drawer.Trigger>
		{#snippet child({ props })}
			<div
				class="fixed top-2 left-1/2 z-50 flex -translate-x-1/2 rounded-xl border border-muted/10 bg-foreground p-1 text-background shadow-lg @7xl/main:hidden"
			>
				<Button {...props} size="icon" variant="ghost" class="mx-auto w-20">
					<ListBoldIcon class="size-5" />
				</Button>
			</div>
		{/snippet}
	</Drawer.Trigger>

	<Drawer.Content class="@container/drawer-content">
		<Drawer.Header>
			<Drawer.Title class="mx-auto">
				<a href={resolve('/')} class="w-fit">
					<Logo class="h-10" />
				</a>
			</Drawer.Title>
		</Drawer.Header>

		{@render invitations?.()}

		<nav class="mx-auto grid w-full max-w-md gap-6" {@attach closeDrawerAttachment}>
			<ul class="space-y-6 text-lg">
				{#each budgets as budget (budget.id)}
					<li class="space-y-1 rounded-lg bg-surface p-1.5 shadow-sm">
						<a
							href={resolve('/(app)/[budgetId=id]', { budgetId: budget.id })}
							class={cn(
								'group flex grow items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/5',
								isCurrentPage(page, budget.id) && 'bg-info/10 text-info hover:bg-info/15'
							)}
						>
							{budget.name}
						</a>

						{#if budget.accounts}
							<ul class="space-y-1">
								{#each budget.accounts as account (account.id)}
									<li class="flex">
										<div
											class={cn(
												'mx-1 my-auto aspect-square',
												isCurrentPage(page, account.id) ? 'text-info' : 'text-muted'
											)}
										>
											<ArrowBendDownRightBoldIcon class="size-3" />
										</div>

										<a
											href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
												accountId: account.id,
												budgetId: budget.id
											})}
											class={cn(
												'group flex grow items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/5',
												isCurrentPage(page, account.id) && 'bg-info/10 text-info hover:bg-info/15'
											)}
										>
											{account.name}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>

			<ul class="space-y-1 rounded-lg bg-surface p-1.5 text-lg shadow-sm">
				<li class="flex">
					<a
						href={resolve('/(app)/new')}
						class={cn(
							'group flex grow items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/5',
							isCurrentPage(page, 'new') && 'bg-info/10 text-info hover:bg-info/15'
						)}
					>
						<PlusIcon
							class={cn('size-6', isCurrentPage(page, 'new') ? 'text-success' : 'text-muted')}
						/>
						{m.budget_create_button()}
					</a>
				</li>

				<li class="flex">
					<a
						href={resolve('/(app)/settings')}
						class={cn(
							'group flex grow items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/5',
							isCurrentPage(page, 'settings') && 'bg-info/10 text-info hover:bg-info/15'
						)}
					>
						<GearSixIcon
							class={cn('size-6', isCurrentPage(page, 'settings') ? 'text-success' : 'text-muted')}
						/>
						{m.settings_title()}
					</a>
				</li>

				{#if user.isAdmin}
					<li class="flex">
						<a
							href={resolve('/(app)/admin')}
							class={cn(
								'group flex grow items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/5',
								isCurrentPage(page, 'admin') && 'bg-info/10 text-info hover:bg-info/15'
							)}
						>
							<WrenchIcon
								class={cn('size-6', isCurrentPage(page, 'admin') ? 'text-success' : 'text-muted')}
							/>
							{m.admin_settings_title()}
						</a>
					</li>
				{/if}

				<li class="flex">
					<form action="/login?/logout" method="post" class="contents">
						<button
							type="submit"
							class="group flex grow items-center gap-2 rounded-md p-2 transition-colors hover:cursor-pointer hover:bg-muted/5"
						>
							<div aria-hidden="true">
								<SignOutIcon class="size-6 text-muted" />
							</div>
							{m.sign_out_button({ username: user.username })}
						</button>
					</form>
				</li>
			</ul>
		</nav>
	</Drawer.Content>
</Drawer.Root>
