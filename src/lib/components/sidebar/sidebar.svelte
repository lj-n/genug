<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Sortable from 'sortablejs';
	import { onMount } from 'svelte';

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

	let budgetContainerRef: HTMLElement;

	onMount(() => {
		if (!budgetContainerRef) return;

		const sortable = new Sortable(budgetContainerRef, {
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
		});

		return sortable.destroy;
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
</script>

<ul class="grid space-y-3" bind:this={budgetContainerRef}>
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
