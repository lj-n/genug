<script lang="ts">
	import type { PageData } from './$types';
	import BudgetTable from './budget.table.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import CreateCategoryForm from '../../categories/create/+page.svelte';
	import RetiredCategoriesPage from '../../categories/retired/+page.svelte';
	import { page } from '$app/stores';
	import { createShallowRoute } from '$lib/shallow.routing';
	import { buttonVariants } from '$lib/components/ui/button';
	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import type { PageData as CreateCategoryPageDate } from '../../categories/create/$types';
	import type { PageData as RetiredCategoriesPageData } from '../../categories/retired/$types';
	import LucideFolderPlus from '~icons/lucide/folder-plus';
	import LucideFolderArchive from '~icons/lucide/folder-archive';
	import { cn } from '$lib/utils';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

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

	const [createAction, createData, createIsOpen] =
		createShallowRoute<CreateCategoryPageDate>();

	const [retiredAction, retiredData, retiredIsOpen] =
		createShallowRoute<RetiredCategoriesPageData>();
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

<div class="mt-4 flex flex-wrap items-start justify-between">
	{#if data.retiredCategories.length > 0}
		<a
			href="/categories/retired"
			use:retiredAction={$page.url}
			class={cn(
				buttonVariants({
					variant: 'ghost',
					size: 'sm'
				})
			)}
		>
			<LucideFolderArchive class="mr-2" />
			{data.retiredCategories.length} retired categories
		</a>
	{/if}

	<a
		href="/categories/create"
		use:createAction={$page.url}
		class={buttonVariants({
			variant: 'outline'
		})}
	>
		<LucideFolderPlus class="mr-2" />
		Create New Category
	</a>
</div>

<ShallowRouteModal open={$createIsOpen} close={() => history.back()}>
	{#if $createData}
		<CreateCategoryForm data={$createData} />
	{/if}
</ShallowRouteModal>

<Sheet.Root
	open={$retiredIsOpen}
	onOpenChange={(open) => {
		if (!open) history.back();
	}}
>
	<Sheet.Content side="left" class="sm:max-w-xl">
		{#if $retiredData}
			<ScrollArea
				orientation="vertical"
				class="my-4 h-[calc(100vh-3rem)] pb-6 pl-2"
			>
				<RetiredCategoriesPage data={$retiredData} />
			</ScrollArea>
		{/if}
	</Sheet.Content>
</Sheet.Root>
