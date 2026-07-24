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
	import ArrowBendDownRightBoldIcon from '~icons/ph/arrow-bend-down-right-bold';
	import DotsSixVerticalIcon from '~icons/ph/dots-six-vertical';

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
			'group flex items-center rounded-md text-sm transition-colors hover:bg-muted/5',
			isSubItem ? 'text-muted hover:text-foreground' : 'font-medium text-foreground',
			isActive && 'text-info hover:text-info'
		)}
	>
		<a {href} class="flex min-w-0 grow items-center gap-1.5 px-2 py-1">
			{#if isSubItem}
				<ArrowBendDownRightBoldIcon
					class={cn('size-3 shrink-0', isActive ? 'text-info' : 'text-muted')}
					aria-hidden="true"
				/>
			{:else}
				<!-- The inline dot marks the current budget; the slot keeps budget
				     labels aligned whether or not they are active. -->
				<span
					class={cn('size-1.5 shrink-0 rounded-full', isActive ? 'bg-info' : 'bg-transparent')}
					aria-hidden="true"
				></span>
			{/if}
			<span class="truncate">{name}</span>
		</a>

		<button
			type="button"
			aria-label={m.drag_handle_label()}
			title={m.drag_handle_label()}
			disabled={dragDisabled}
			aria-disabled={dragDisabled}
			class={cn(
				'mr-1 shrink-0 cursor-grab rounded-sm p-0.5 opacity-0',
				'group-hover:opacity-100 focus-visible:opacity-100',
				dragDisabled && 'hidden'
			)}
			data-drag-handle={dragHandleIdentifier}
		>
			<DotsSixVerticalIcon class="size-4 text-muted" />
		</button>
	</div>
{/snippet}

<ul {@attach budgetSortable.attach} class="flex flex-col gap-2">
	{#each budgets as budget (budget.id)}
		{@const accounts = await getAccounts(budget.id)}

		<li
			transition:slide={{ axis: 'y' }}
			class="flex flex-col"
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

				<ul {@attach accountSortable.attach} class="ml-3 flex flex-col">
					{#each accounts as account (account.id)}
						<li data-drag-item={budget.id} data-sortable-id={account.id} class="flex flex-col">
							{@render navitem({
								dragDisabled: accounts.length <= 1,
								dragHandleIdentifier: budget.id,
								href: resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
									accountId: account.id,
									budgetId: budget.id
								}),
								isActive: isCurrentPage(page, account.id),
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
