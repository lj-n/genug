<script lang="ts">
	import { resolve } from '$app/paths';
	import { sortableList } from '$lib/utils/sort-helper';
	import Sortable from 'sortablejs';
	import { untrack } from 'svelte';

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
		saveOrder: (args: { entity: 'account' | 'budget'; orderedIds: string[] }) => Promise<Response>;
	} = $props();

	let snapshot = untrack(() => accounts);

	const accountSortOptions: Sortable.Options = {
		animation: 150,
		dataIdAttr: 'data-drag-id',
		direction: 'vertical',
		get draggable() {
			return `[data-drag-item="${budgetId}"]`;
		},
		get group() {
			return budgetId;
		},
		get handle() {
			return `[data-drag-handle="${budgetId}"]`;
		},

		get sort() {
			return accounts.length > 1;
		},
		store: {
			get: () => {
				return accounts.map((account) => account.id);
			},
			set: async (sortable: Sortable) => {
				const nextAccounts = sortable.toArray();

				try {
					const res = await saveOrder({
						entity: 'account',
						orderedIds: nextAccounts
					});
					if (!res.ok) {
						sortable.sort(
							snapshot.map((account) => account.id),
							true
						);
						accounts = snapshot;
					}
				} catch {
					sortable.sort(
						snapshot.map((account) => account.id),
						true
					);
					accounts = snapshot;
				}
			}
		}
	};
</script>

<ul class="grid" {@attach sortableList(accountSortOptions)}>
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
