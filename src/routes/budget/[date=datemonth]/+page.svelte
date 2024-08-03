<script lang="ts">
	import type { PageData } from './$types';
	import BudgetTable from './budget.table.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateCategoryForm from '$routes/categories/create/+page.svelte';
	import { page } from '$app/stores';
	import { createShallowRoute } from '$lib/shallow.routing';
	import { buttonVariants } from '$lib/components/ui/button';
	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import type { PageData as CreateCategoryPageDate } from '../../categories/create/$types';

	export let data: PageData;

	type TeamId = number;

	$: ({ budget: completeBudget } = data);

	$: groupedBudgets = completeBudget.reduce((acc, row) => {
		if (acc.has(row.team)) {
			acc.get(row.team)?.push(row);
		} else {
			acc.set(row.team, [row]);
		}
		return acc;
	}, new Map<null | TeamId, PageData['budget']>());

	/**
	 * Sort grouped budgets by team name, with personal budget (key==null) first
	 */
	$: sortGroupedBudgets = new Map(
		[...groupedBudgets.entries()].sort(([key]) => {
			if (key === null) return -1;
			return 1;
		})
	);

	const selectedTeamParam = 'selectedTeam';
	$: selectedTeamId = $page.url.searchParams.get(selectedTeamParam);

	const [shallowRouteAction, shallowRouteData, shallowRouteIsOpen] =
		createShallowRoute<CreateCategoryPageDate>();
</script>

<svelte:head>
	<title>Budget | {data.localDate}</title>
</svelte:head>

<h1 class="mb-12 scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
	Budget
	<span class="text-primary">{data.localDate}</span>
</h1>

<Tabs.Root value={String(selectedTeamId)}>
	<Tabs.List>
		{#each sortGroupedBudgets.entries() as [teamId]}
			{@const team = data.teams.find((t) => t.id === teamId)}
			<Tabs.TriggerLink
				href={`${$page.url.pathname}?${selectedTeamParam}=${teamId}`}
				active={String(teamId) === String(selectedTeamId)}
				data-sveltekit-keepfocus
			>
				{team?.name ?? 'Personal'}
			</Tabs.TriggerLink>
		{/each}
	</Tabs.List>

	{#each sortGroupedBudgets.entries() as [teamId, budget]}
		{@const team = data.teams.find((t) => t.id === teamId)}
		<Tabs.Content value={team?.id.toString() ?? String(null)}>
			<div class="flex flex-col">
				<p class="my-4 max-w-60 pl-2 italic text-muted-foreground">
					{team?.description ?? 'Your personal categories.'}
				</p>
				{#key teamId}
					<BudgetTable {budget} />
				{/key}
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>

<div class="mx-auto mt-12">
	<a
		href="/categories/create"
		use:shallowRouteAction={$page.url.pathname}
		class={buttonVariants({
			variant: 'outline'
		})}
	>
		Create New Category
	</a>

	<ShallowRouteModal open={$shallowRouteIsOpen} close={() => history.back()}>
		{#if $shallowRouteData}
			<CreateCategoryForm data={$shallowRouteData} />
		{/if}
	</ShallowRouteModal>
</div>
