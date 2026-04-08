<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
	import { defaultPreset } from '@dnd-kit/dom';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { createSortable, isSortable } from '@dnd-kit/svelte/sortable';
	import { fade, slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import PhArrowElbowDownRight from '~icons/ph/arrow-elbow-down-right';
	import PhArrowFatRightDuotone from '~icons/ph/arrow-fat-right-duotone';
	import PhDotsSixVertical from '~icons/ph/dots-six-vertical';

	import type { PageData } from './$types';

	let data: { budgets: PageData['budgets'] } = $props();

	let isActive = $derived.by(() => {
		return (id: string) => {
			if (page.params.account) return page.params.account === id;
			if (page.params.budget) return page.params.budget === id;
			return false;
		};
	});

	let budgets = $state(data.budgets);
</script>

<div class="rounded-md border border-muted/20 bg-surface p-2 shadow-xs">
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
				const nextItems = [...budgets];
				const [movedItem] = nextItems.splice(initialIndex, 1);
				nextItems.splice(index, 0, movedItem);
				budgets = nextItems;
				return;
			}

			const budgetIndex = budgets.findIndex((item) => item.id === group);
			if (budgetIndex === -1) return;

			const nextItems = [...budgets];
			const accounts = [...nextItems[budgetIndex].accounts];
			const [movedAccount] = accounts.splice(initialIndex, 1);
			accounts.splice(index, 0, movedAccount);
			nextItems[budgetIndex] = { ...nextItems[budgetIndex], accounts };
			budgets = nextItems;
		}}
	>
		<ul class="grid space-y-3">
			{#each budgets as budget, budgetIdx (budget.id)}
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
						'rounded-md bg-surface p-0.5',
						budgetSortable.isDragging && 'shadow-lg ring-3 ring-interactive/50'
					)}
					{@attach budgetSortable.attach}
				>
					<div
						class={cn(
							'flex items-center rounded-md p-2 hover:bg-muted/5',
							isActive(budget.id) && !budgetSortable.isDragging && 'bg-info/10 hover:bg-info/15'
						)}
					>
						<a
							href={resolve('/(app)/[budget]', { budget: budget.id })}
							class="flex w-full items-center font-medium"
						>
							{#if isActive(budget.id)}
								<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }}>
									<div transition:fade={{ duration: 200 }} class="pr-2">
										<PhArrowFatRightDuotone class="size-4 text-info" />
									</div>
								</div>
							{/if}
							{budget.name}
						</a>

						<button aria-label="Drag Handle" class="ml-auto" {@attach budgetSortable.attachHandle}>
							<PhDotsSixVertical class="size-4 text-muted/60" />
						</button>
					</div>

					<ul class="grid space-y-0.5">
						{#each budget.accounts as account, accountIdx (account.id)}
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
									'flex items-center rounded-md bg-surface p-2 hover:bg-muted/5',
									isActive(account.id) &&
										!accountSortable.isDragging &&
										'bg-info/10 hover:bg-info/15',
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
									{#if isActive(account.id)}
										<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }}>
											<div transition:fade={{ duration: 200 }} class="pr-2">
												<PhArrowFatRightDuotone class="size-4 text-info" />
											</div>
										</div>
									{:else}
										<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }}>
											<div transition:fade={{ duration: 200 }} class="pr-2">
												<PhArrowElbowDownRight class="size-3 text-muted/50" />
											</div>
										</div>
									{/if}
									{account.name}
								</a>

								<button
									aria-label="Drag Handle"
									class="ml-auto"
									{@attach accountSortable.attachHandle}
								>
									<PhDotsSixVertical class="size-4 text-muted/60" />
								</button>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	</DragDropProvider>
</div>
