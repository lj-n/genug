<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { sortableList } from '$lib/utils/sort-helper';
	import Sortable from 'sortablejs';

	import SidebarAccounts from './sidebar-accounts.svelte';
	import SidebarItem from './sidebar-item.svelte';

	export type BudgetData = Array<
		ReturnType<App.Actions['budget']['all']>[number] & {
			accounts: Array<ReturnType<App.Actions['account']['all']>[number]>;
		}
	>;

	let {
		budgets
	}: {
		budgets: BudgetData;
	} = $props();

	let isActive = $derived.by(() => {
		return (id: string) => {
			if (page.params.account) return page.params.account === id;
			if (page.params.budget) return page.params.budget === id;
			return false;
		};
	});

	async function saveOrder({
		entity,
		orderedIds
	}: {
		entity: 'account' | 'budget';
		orderedIds: string[];
	}) {
		try {
			const response = await fetch('/api/reorder', {
				body: JSON.stringify({
					entity,
					orderedIds
				}),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});

			if (response.ok) return;
		} catch {
			//
		}
	}

	const budgetSortOptions: Sortable.Options = {
		animation: 150,
		dataIdAttr: 'data-drag-id',
		direction: 'vertical',
		draggable: '[data-drag-item]',
		group: 'budget',
		handle: '[data-drag-handle]',

		get sort() {
			return budgets.length > 1;
		},
		get store() {
			return {
				get: () => {
					return budgets.map((budget) => budget.id);
				},
				set: (sortable: Sortable) => {
					const nextBudgets = sortable.toArray();

					void saveOrder({
						entity: 'budget',
						orderedIds: nextBudgets
					});
				}
			};
		}
	};
</script>

<ul class="grid space-y-3" {@attach sortableList(budgetSortOptions)}>
	{#each budgets as budget (budget.id)}
		<SidebarItem
			dragId={budget.id}
			dragContainerId="budget"
			dragDisabled={budgets.length <= 1}
			isActive={isActive(budget.id)}
			href={resolve('/(app)/[budget]', { budget: budget.id })}
			label={budget.name}
		>
			<SidebarAccounts accounts={budget.accounts} budgetId={budget.id} {isActive} {saveOrder} />
		</SidebarItem>
	{/each}
</ul>
