<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { ResolvedPathname } from '$app/types';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts, reorderAccounts } from '$lib/remote-functions/account.remote';
	import { getBudgets, reorderBudgets } from '$lib/remote-functions/budget.remote';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { createSortable } from '$lib/utils/sort-helper.svelte';
	import { slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import PhArrowBendDownRightBold from '~icons/ph/arrow-bend-down-right-bold';
	import PhDotsSixVertical from '~icons/ph/dots-six-vertical';

	type NavitemProps = {
		dragDisabled?: boolean;
		dragHandleIdentifier: string;
		href: ResolvedPathname;
		isActive?: boolean;
		isSubItem?: boolean;
		name: string;
	};

	const budgets = $derived(await getBudgets());
	const budgetSortable = createSortable(() => budgets, {
		direction: 'vertical',
		draggable: '[data-drag-item="budget"]',
		group: 'budget',
		handle: '[data-drag-handle="budget"]',
		get sort() {
			return budgets.length > 1;
		},
		sortedCallback: async (orderedIds: string[]) => {
			await reorderBudgets(orderedIds);
			return new Response(null, { status: 200 });
		}
	});
</script>

{#snippet navitem({
	dragDisabled = false,
	dragHandleIdentifier,
	href,
	isActive = false,
	isSubItem = false,
	name
}: NavitemProps)}
	<div
		class={cn(
			'group flex grow items-center gap-2 rounded-md transition-colors hover:bg-muted/5',
			isActive && 'bg-info/10 text-info hover:bg-info/15'
		)}
	>
		<a {href} class={cn('flex w-full items-center p-2', !isSubItem && 'font-medium')}>
			{name}
		</a>

		<button
			type="button"
			aria-label={m.drag_handle_label()}
			title={m.drag_handle_label()}
			disabled={dragDisabled}
			aria-disabled={dragDisabled}
			class={cn(
				'ml-auto cursor-grab rounded-sm opacity-0',
				'group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-info/50 focus-visible:outline-none',
				dragDisabled && 'hidden'
			)}
			data-drag-handle={dragHandleIdentifier}
		>
			<PhDotsSixVertical class="size-6 text-interactive" />
		</button>
	</div>
{/snippet}

<ul {@attach budgetSortable.attach} class="grid">
	{#each budgets as budget (budget.id)}
		{@const accounts = await getAccounts(budget.id)}

		<li
			transition:slide={{ axis: 'y' }}
			class="grid space-y-1 pt-2"
			data-drag-item="budget"
			data-sortable-id={budget.id}
		>
			{@render navitem({
				dragDisabled: budgets.length <= 1,
				dragHandleIdentifier: 'budget',
				href: resolve('/(app)/[budgetId=id]', { budgetId: budget.id }),
				isActive: isCurrentPage(page, budget.id),
				name: budget.name
			})}

			{#if accounts.length > 0}
				{@const accountSortable = createSortable(() => accounts, {
					direction: 'vertical',
					get draggable() {
						return `[data-drag-item="${budget.id}"]`;
					},
					get group() {
						return budget.id;
					},
					get handle() {
						return `[data-drag-handle="${budget.id}"]`;
					},
					get sort() {
						return accounts.length > 1;
					},
					sortedCallback: async (orderedIds: string[]) => {
						await reorderAccounts(orderedIds);
						return new Response(null, { status: 200 });
					}
				})}

				<ul {@attach accountSortable.attach} class="space-y-0.5 pl-2">
					{#each accounts as account (account.id)}
						{@const isActive = isCurrentPage(page, account.id)}
						<li data-drag-item={budget.id} data-sortable-id={account.id} class="flex">
							<div class={cn('mx-1 my-auto aspect-square', isActive ? 'text-info' : 'text-muted')}>
								<PhArrowBendDownRightBold class="size-3" />
							</div>

							{@render navitem({
								dragDisabled: accounts.length <= 1,
								dragHandleIdentifier: budget.id,
								href: resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
									accountId: account.id,
									budgetId: budget.id
								}),
								isActive,
								isSubItem: true,
								name: account.name
							})}
						</li>
					{/each}
				</ul>
			{/if}
		</li>
	{/each}
</ul>
