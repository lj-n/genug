<script lang="ts">
	import type { PageData } from './$types';
	import BudgetTable from './budget.table.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Avatar from '$lib/components/ui/avatar';
	import Feather from '$lib/components/feather.svelte';
	import BudgetCategoryNew from './budget.category.new.svelte';

	export let data: PageData;

	const groupedBudgets = data.budget.reduce((acc, row) => {
		if (acc.has(row.team)) {
			acc.get(row.team)?.push(row);
		} else {
			acc.set(row.team, [row]);
		}
		return acc;
	}, new Map<null | number, PageData['budget']>());

	/**
	 * Sort grouped budgets by team name, with personal budget (key==null) first
	 */
	const sortGroupedBudgets = new Map(
		[...groupedBudgets.entries()].sort((a, b) => {
			if (a[0] === null) return -1;
			return 1;
		})
	);

	/**
	 * Generate a random id to match the tabs
	 */
	const randId = crypto.randomUUID();
</script>

<svelte:head>
	<title>Budget | {data.localDate}</title>
</svelte:head>

<h1 class="mb-12 scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
	Budget for
	<span class="text-primary">{data.localDate}</span>
</h1>

<Tabs.Root value={randId} class="">
	<Tabs.List>
		{#each sortGroupedBudgets.entries() as [teamId]}
			{@const team = data.teams.find((t) => t.id === teamId)}
			<Tabs.Trigger value={team?.id.toString() ?? randId}>
				{team?.name ?? 'Personal'}
			</Tabs.Trigger>
		{/each}
	</Tabs.List>
	{#each sortGroupedBudgets.entries() as [teamId, budget]}
		{@const team = data.teams.find((t) => t.id === teamId)}
		<Tabs.Content value={team?.id.toString() ?? randId}>
			<div class="flex flex-col">
				<p class="my-6 max-w-60 pl-2 italic text-muted-foreground">
					{team?.description ?? 'Your personal categories.'}
				</p>

				<BudgetTable {budget} />

				<BudgetCategoryNew />
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>
