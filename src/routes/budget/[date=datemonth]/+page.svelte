<script lang="ts">
	import type { PageData } from './$types';
	import BudgetTable from './budget.table.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateCategoryForm from '../../categories/category.create.form.svelte';
	import { page } from '$app/stores';

	export let data: PageData;

	$: groupedBudgets = data.budget.reduce((acc, row) => {
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
	$: sortGroupedBudgets = new Map(
		[...groupedBudgets.entries()].sort((a, b) => {
			if (a[0] === null) return -1;
			return 1;
		})
	);

	/**
	 * Use the random id to match the tabs
	 */
	$: selectedTeam =
		data.teams
			.find((t) => t.id === Number(data.selectedBudget))
			?.id.toString() ?? data.randId;
</script>

<svelte:head>
	<title>Budget | {data.localDate}</title>
</svelte:head>

<h1 class="mb-12 scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
	Budget for
	<span class="text-primary">{data.localDate}</span>
</h1>

<Tabs.Root value={selectedTeam}>
	<Tabs.List>
		{#each sortGroupedBudgets.entries() as [teamId]}
			{@const team = data.teams.find((t) => t.id === teamId)}
			<a
				href={team
					? `${$page.url.pathname}?selectedBudget=${team?.id}`
					: `${$page.url.pathname}`}
				data-sveltekit-keepfocus
			>
				<Tabs.Trigger
					value={team?.id.toString() ?? data.randId}
					class="data-[state=active]:text-primary"
					on:click={(e) => e.preventDefault()}
				>
					{team?.name ?? 'Personal'}
				</Tabs.Trigger>
			</a>
		{/each}
	</Tabs.List>

	{#each sortGroupedBudgets.entries() as [teamId, budget]}
		{@const team = data.teams.find((t) => t.id === teamId)}
		<Tabs.Content value={team?.id.toString() ?? data.randId}>
			<div class="flex flex-col">
				<p class="my-4 max-w-60 pl-2 italic text-muted-foreground">
					{team?.description ?? 'Your personal categories.'}
				</p>

				<BudgetTable data={budget} />

				<CreateCategoryForm
					form={data.createCategoryForm}
					teams={data.teams}
					initialTeamSelect={Number(selectedTeam)}
				/>
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>
