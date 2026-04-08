<script lang="ts">
	import { resolve } from '$app/paths';
	import Sortable from 'sortablejs';
	import { onMount } from 'svelte';

	import type { BudgetData } from './sidebar.svelte';

	import SidebarItem from './sidebar-item.svelte';

	let {
		accounts,
		budgetId,
		isActive,
		saveOrder
	}: {
		accounts: BudgetData[number]['accounts'];
		budgetId: string;
		isActive: (id: string) => boolean;
		saveOrder: (args: { entity: 'account' | 'budget'; orderedIds: string[] }) => void;
	} = $props();

	let sortContainerRef: HTMLElement;

	onMount(() => {
		if (!sortContainerRef) return;
		const sortable = new Sortable(sortContainerRef, {
			animation: 150,
			dataIdAttr: 'data-drag-id',
			direction: 'vertical',
			draggable: `[data-drag-item="${budgetId}"]`,
			group: budgetId,
			handle: `[data-drag-handle="${budgetId}"]`,
			get sort() {
				return accounts.length > 1;
			},
			store: {
				get: () => {
					return accounts.map((account) => account.id);
				},
				set: (sortable: Sortable) => {
					const nextAccounts = sortable.toArray();

					void saveOrder({
						entity: 'account',
						orderedIds: nextAccounts
					});
				}
			}
		});

		return sortable.destroy;
	});
</script>

<ul class="grid" bind:this={sortContainerRef}>
	{#each accounts as account (account.id)}
		<SidebarItem
			dragId={account.id}
			dragContainerId={budgetId}
			dragDisabled={accounts.length <= 1}
			isActive={isActive(account.id)}
			showSubIndicator
			href={resolve('/(app)/[budget]/accounts/[account]', {
				account: account.id,
				budget: budgetId
			})}
			label={account.name}
		/>
	{/each}
</ul>
