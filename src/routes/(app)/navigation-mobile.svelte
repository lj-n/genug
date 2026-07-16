<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Logo } from '$lib/components/ui/logo';
	import { SourceLink } from '$lib/components/ui/source-link';
	import { VersionLabel } from '$lib/components/ui/version-label';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { signout } from '$lib/remote-functions/auth.remote';
	import { getBudgets } from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { cn } from 'tailwind-variants';
	import ArrowBendDownRightBoldIcon from '~icons/ph/arrow-bend-down-right-bold';
	import GearSixIcon from '~icons/ph/gear-six';
	import ListBoldIcon from '~icons/ph/list-bold';
	import PlusIcon from '~icons/ph/plus';
	import SignOutIcon from '~icons/ph/sign-out';
	import WrenchIcon from '~icons/ph/wrench';

	let { invitations }: { invitations: Snippet } = $props();

	const user = $derived(await getUser());

	let open = $state(false);

	const closeDrawerAttachment: Attachment<HTMLElement> = (node) => {
		function closeDrawer(e: MouseEvent) {
			// Use event delegation — the links inside the <nav> are loaded
			// asynchronously (await getBudgets / getAccounts), so querySelectorAll
			// at mount time won't find them. Instead, check if the click target
			// is or is inside an <a> element.
			const target = e.target as HTMLElement;
			if (target.closest('a')) {
				open = false;
			}
		}

		node.addEventListener('click', closeDrawer);
		return () => {
			node.removeEventListener('click', closeDrawer);
		};
	};
</script>

<Drawer.Root bind:open>
	<Drawer.Trigger>
		{#snippet child({ props })}
			<!-- Bottom-right so it never covers the page heading or its action
			     buttons; z-40 keeps it underneath every drawer/dialog (z-50). -->
			<div
				class="fixed right-4 bottom-4 z-40 flex rounded-xl border border-muted/10 bg-foreground p-1 text-background shadow-lg @7xl/main:hidden"
			>
				<Button {...props} size="icon" variant="ghost" class="size-11">
					<span class="sr-only">Toggle Navigation</span>
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
			<Drawer.Close
				aria-label={m.dialog_close()}
				class="absolute top-4 right-4 rounded-md p-1 text-muted hover:bg-muted/10 hover:text-foreground"
			>
				<span class="sr-only">{m.dialog_close()}</span>
				<svg class="size-5" viewBox="0 0 256 256" fill="currentColor">
					<path
						d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128z"
					/>
				</svg>
			</Drawer.Close>
		</Drawer.Header>

		<!-- The budget/account lists can outgrow the sheet; Drawer.Body is the
		     one scroll region so the header stays pinned (see ADR-0013). -->
		<Drawer.Body class="px-4">
			{@render invitations?.()}

			<nav class="mx-auto grid w-full max-w-md gap-6" {@attach closeDrawerAttachment}>
				<ul class="space-y-6 text-lg">
					{#each await getBudgets() as budget (budget.id)}
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

							<ul class="space-y-1">
								{#each await getAccounts(budget.id) as account (account.id)}
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
								class={cn(
									'size-6',
									isCurrentPage(page, 'settings') ? 'text-success' : 'text-muted'
								)}
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
						<form {...signout.for('mobile-navigation')} class="contents">
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

				<div class="mx-auto mb-4 flex items-center gap-2">
					<VersionLabel />
					<SourceLink />
				</div>
			</nav>
		</Drawer.Body>
	</Drawer.Content>
</Drawer.Root>
