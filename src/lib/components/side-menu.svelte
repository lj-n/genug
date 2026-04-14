<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { ResolvedPathname } from '$app/types';
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { isCurrentPage } from '$lib/utils/is-current-page';
	import { createSortable } from '$lib/utils/sort-helper.svelte';
	import { cn } from 'tailwind-variants';
	import PhDotsSixVertical from '~icons/ph/dots-six-vertical';
	import PhPiggyBankDuotone from '~icons/ph/piggy-bank-duotone';
	import PhScalesDuotone from '~icons/ph/scales-duotone';

	type BudgetData = Array<
		ReturnType<App.Actions['budget']['all']>[number] & {
			accounts: Array<ReturnType<App.Actions['account']['all']>[number]>;
		}
	>;
	let { budgets }: { budgets: BudgetData } = $props();

	function saveOrder(entity: 'account' | 'budget') {
		return (orderedIds: string[]) =>
			fetch('/api/reorder', {
				body: JSON.stringify({
					entity,
					orderedIds
				}),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});
	}

	const budgetSortable = createSortable(() => budgets, {
		direction: 'vertical',
		draggable: '[data-drag-item="budget"]',
		group: 'budget',
		handle: '[data-drag-handle="budget"]',
		get sort() {
			return budgets.length > 1;
		},
		sortedCallback: saveOrder('budget')
	});

	type NavitemProps = {
		dragDisabled?: boolean;
		dragHandleIdentifier: string;
		href: ResolvedPathname;
		icon: Snippet<[isActive: boolean]>;
		isActive?: boolean;
		isSubItem?: boolean;
		name: string;
	};
</script>

{#snippet budgetIcon(isActive = false)}
	<PhScalesDuotone class={cn('size-6', isActive ? 'text-info' : 'text-muted/60')} />
{/snippet}

{#snippet accountIcon(isActive = false)}
	<PhPiggyBankDuotone class={cn('size-6', isActive ? 'text-info' : 'text-muted/60')} />
{/snippet}

{#snippet navitem({
	dragDisabled = false,
	dragHandleIdentifier,
	href,
	icon,
	isActive = false,
	isSubItem = false,
	name
}: NavitemProps)}
	<div
		class={cn(
			'group flex items-center gap-2 rounded-md bg-background transition-colors hover:bg-muted/5',
			isActive && 'bg-info/10 text-info hover:bg-info/15'
		)}
	>
		<a {href} class={cn('flex w-full items-center gap-2 p-2', !isSubItem && 'font-medium')}>
			<div aria-hidden="true">
				{@render icon(isActive)}
			</div>

			{name}
		</a>

		<button
			type="button"
			aria-label="Drag Handle"
			title="Drag Handle"
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

<ul {@attach budgetSortable.attach} class="grid space-y-2">
	{#each budgets as budget (budget.id)}
		<li class="flex flex-col" data-drag-item="budget" data-sortable-id={budget.id}>
			{@render navitem({
				dragDisabled: budgets.length <= 1,
				dragHandleIdentifier: 'budget',
				href: resolve('/(app)/[budget]', { budget: budget.id }),
				icon: budgetIcon,
				isActive: isCurrentPage(page, budget.id),
				name: budget.name
			})}

			{#if budget.accounts.length > 0}
				{@const accountSortable = createSortable(() => budget.accounts, {
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
						return budget.accounts.length > 1;
					},
					sortedCallback: saveOrder('account')
				})}

				<ul {@attach accountSortable.attach} class="p-2">
					{#each budget.accounts as account (account.id)}
						<li
							data-drag-item={budget.id}
							data-sortable-id={account.id}
							class="border-l border-muted/20 pl-2"
						>
							{@render navitem({
								dragDisabled: budget.accounts.length <= 1,
								dragHandleIdentifier: budget.id,
								href: resolve('/(app)/[budget]/accounts/[account]', {
									account: account.id,
									budget: budget.id
								}),
								icon: accountIcon,
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
