<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
	import { defaultPreset } from '@dnd-kit/dom';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { createSortable, isSortable } from '@dnd-kit/svelte/sortable';
	import { untrack } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import PhArrowElbowDownRight from '~icons/ph/arrow-elbow-down-right';
	import PhArrowFatRightDuotone from '~icons/ph/arrow-fat-right-duotone';
	import PhDotsSixVertical from '~icons/ph/dots-six-vertical';

	import type { PageData } from './$types';

	let data: { budgets: PageData['budgets'] } = $props();
	type SortableItem = ReturnType<typeof createSortable>;

	const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
		const nextItems = [...items];
		const [movedItem] = nextItems.splice(fromIndex, 1);

		if (!movedItem) return nextItems;

		nextItems.splice(toIndex, 0, movedItem);
		return nextItems;
	};

	let isActive = $derived.by(() => {
		return (id: string) => {
			if (page.params.account) return page.params.account === id;
			if (page.params.budget) return page.params.budget === id;
			return false;
		};
	});

	let budgets = $state(untrack(() => data.budgets));
</script>

<div class="">
	{#snippet LeadingIcon(isCurrent: boolean, showFallback: boolean)}
		{#if isCurrent}
			<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }}>
				<div transition:fade={{ duration: 200 }} class="pr-2">
					<PhArrowFatRightDuotone class="size-4 text-info" />
				</div>
			</div>
		{:else if showFallback}
			<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }}>
				<div transition:fade={{ duration: 200 }} class="pr-2">
					<PhArrowElbowDownRight class="size-3 text-muted" />
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet DragHandle(sortable: SortableItem, visibilityClass: string)}
		<button
			aria-label="Drag Handle"
			class={cn(
				`ml-auto cursor-grab opacity-0 ${visibilityClass}`,
				sortable.isDragging && 'cursor-grabbing opacity-100'
			)}
			{@attach sortable.attachHandle}
		>
			<PhDotsSixVertical class="size-4 text-muted hover:text-interactive" />
		</button>
	{/snippet}

	<DragDropProvider
		plugins={defaultPreset.plugins}
		modifiers={[RestrictToVerticalAxis]}
		onDragOver={(event) => {
			const { source, target } = event.operation;

			if (!isSortable(source) || !isSortable(target)) return;

			const { initialGroup: sourceGroup } = source;
			const { group: targetGroup } = target;

			if (sourceGroup !== targetGroup) {
				event.preventDefault();
			}
		}}
		onDragEnd={(event) => {
			if (event.canceled) return;

			const { source } = event.operation;

			if (!isSortable(source)) return;

			const { group, index, initialGroup, initialIndex } = source;

			if (initialGroup !== group || initialIndex === index) return;

			if (group === 'budget') {
				budgets = moveItem(budgets, initialIndex, index);
				return;
			}

			const budgetIndex = budgets.findIndex((item) => item.id === group);
			if (budgetIndex === -1) return;

			const nextItems = [...budgets];
			const accounts = moveItem(nextItems[budgetIndex].accounts, initialIndex, index);
			nextItems[budgetIndex] = { ...nextItems[budgetIndex], accounts };
			budgets = nextItems;
		}}
	>
		<ul class="grid space-y-3">
			{#each budgets as budget, budgetIdx (budget.id)}
				{@const isBudgetActive = isActive(budget.id)}
				{@const budgetSortable = createSortable({
					group: 'budget',
					get id() {
						return `budget-${budget.id}`;
					},
					get index() {
						return budgetIdx;
					}
				})}

				<li
					class={cn(
						'grid rounded-md bg-background',
						budgetSortable.isDragging && 'shadow-lg ring-3 ring-interactive/50'
					)}
					{@attach budgetSortable.attach}
				>
					<div
						class={cn(
							'group/item flex items-center rounded-md bg-background p-2 transition-colors hover:bg-muted/5',
							!budgetSortable.isDragging && isBudgetActive && 'bg-info/10 hover:bg-info/15'
						)}
					>
						<a
							href={resolve('/(app)/[budget]', { budget: budget.id })}
							class="flex w-full items-center font-medium"
						>
							{@render LeadingIcon(isBudgetActive, false)}
							{budget.name}
						</a>

						{@render DragHandle(
							budgetSortable,
							'group-focus-within/item:opacity-100 group-hover/item:opacity-100'
						)}
					</div>

					<ul class="grid">
						{#each budget.accounts as account, accountIdx (account.id)}
							{@const isAccountActive = isActive(account.id)}
							{@const accountSortable = createSortable({
								group: budget.id,
								get id() {
									return `account-${budget.id}-${account.id}`;
								},
								get index() {
									return accountIdx;
								},
								type: 'account'
							})}

							<li
								{@attach accountSortable.attach}
								class={cn(
									'group/sub-item flex items-center rounded-md bg-background p-2 transition-colors hover:bg-muted/5',
									!accountSortable.isDragging && isAccountActive && 'bg-info/10 hover:bg-info/15',
									accountSortable.isDragging && 'shadow-lg ring-3 ring-interactive/50'
								)}
							>
								<a
									href={resolve('/(app)/[budget]/accounts/[account]', {
										account: account.id,
										budget: budget.id
									})}
									class="flex w-full items-center"
								>
									{@render LeadingIcon(isAccountActive, true)}
									{account.name}
								</a>

								{@render DragHandle(
									accountSortable,
									'group-focus-within/sub-item:opacity-100 group-hover/sub-item:opacity-100'
								)}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	</DragDropProvider>
</div>
