<script lang="ts">
	import { resolve } from '$app/paths';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { createSortable, isSortable } from '@dnd-kit/svelte/sortable';
	import { defaultPreset } from '@dnd-kit/dom';

	let items = $state([
		{
			budget: 'Personal',
			href: '/personal',
			uncommitted: 5550,
			accounts: [
				{
					name: 'Checking',
					balance: 5000
				},
				{
					name: 'Savings',
					balance: 10000
				}
			]
		},
		{
			budget: 'Business',
			href: '/business',
			uncommitted: 10000,
			accounts: [
				{
					name: 'Checking',
					balance: 20000
				},
				{
					name: 'Savings',
					balance: 50000
				},
				{
					name: 'Credit Card',
					balance: -5000
				}
			]
		}
	]);

	type AccountItemProps = {
		name: string;
		balance: number;
	};

	type BudgetItemProps = {
		budget: string;
		href: string;
		uncommitted: number;
		accounts: AccountItemProps[];
	};
</script>

{#snippet AccountItem({
	item,
	idx,
	budget
}: {
	item: AccountItemProps;
	idx: number;
	budget: string;
})}
	{@const sortable = createSortable({
		get id() {
			return `account-${budget}-${item.name}`;
		},
		get index() {
			return idx;
		},
		group: budget,
		type: 'account'
	})}

	<li {@attach sortable.attach}>
		<div class="flex items-end justify-between pl-2">
			<a href={resolve('/')}>{item.name}</a>
			<span>{item.balance}</span>
		</div>
	</li>
{/snippet}

{#snippet BudgetItem({ item, idx }: { item: BudgetItemProps; idx: number })}
	{@const sortable = createSortable({
		get id() {
			return `budget-${item.budget}`;
		},
		get index() {
			return idx;
		},
		group: 'budget',
		type: 'budget'
	})}

	<li {@attach sortable.attach}>
		<a class="font-semibold" href={resolve('/')}>{item.budget}</a>

		{#if item.accounts.length > 0}
			<ul class="ml-2 space-y-1 border-l border-muted/30">
				{#each item.accounts as account, idx (account.name)}
					{@render AccountItem({ item: account, idx, budget: item.budget })}
				{/each}
			</ul>
		{/if}
	</li>
{/snippet}

<nav class="sticky top-8 flex w-72 flex-col self-start p-2">
	<DragDropProvider
		plugins={defaultPreset.plugins}
		onDragOver={(event) => {
			const { source, target } = event.operation;

			if (!isSortable(source) || !isSortable(target)) return;

			const { initialGroup: sourceGroup } = source;
			const { group: targetGroup } = target;

			// Prevent cross-group moves
			if (sourceGroup !== targetGroup) {
				event.preventDefault();
			}
		}}
		onDragEnd={(event) => {
			if (event.canceled) return;

			const { source } = event.operation;

			if (isSortable(source)) {
				const { initialIndex, index, initialGroup, group } = source;

				// Prevent cross-group moves (accounts can't change budgets)
				if (initialGroup !== group) return;

				if (group === 'budget') {
					// Handle budget reordering
					const tempItems = [...items];
					const [movedItem] = tempItems.splice(initialIndex, 1);
					tempItems.splice(index, 0, movedItem);
					console.log(
						'Reordered budgets:',
						tempItems.map((i) => i.budget)
					);
					items = tempItems;
				} else {
					// Handle account reordering within a specific budget
					const budgetIndex = items.findIndex((b) => b.budget === group);
					if (budgetIndex !== -1) {
						const tempItems = [...items];
						const accounts = [...tempItems[budgetIndex].accounts];
						const [movedAccount] = accounts.splice(initialIndex, 1);
						accounts.splice(index, 0, movedAccount);
						tempItems[budgetIndex] = { ...tempItems[budgetIndex], accounts };
						console.log(
							`Reordered accounts in ${group}:`,
							accounts.map((a) => a.name)
						);
						items = tempItems;
					}
				}
			}
		}}
	>
		{#if items.length > 0}
			<ul class="space-y-4">
				{#each items as item, idx (item.budget)}
					{@render BudgetItem({ item, idx })}
				{/each}
			</ul>
		{/if}
	</DragDropProvider>
</nav>
