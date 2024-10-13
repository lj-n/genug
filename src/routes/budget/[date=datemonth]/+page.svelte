<script lang="ts">
	import type { PageData } from './$types';
	import BudgetTable from './budget.table.svelte';
	import BudgetBalance from './budget.balance.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import AccountsTeaser from '$lib/components/accounts/accounts.teaser.svelte';
	import CreateCategoryForm from '../../categories/create/+page.svelte';
	import ArchivedCategoriesPage from '../../categories/archived/+page.svelte';
	import { page } from '$app/stores';
	import { createShallowRoute } from '$lib/shallow.routing';
	import { buttonVariants } from '$lib/components/ui/button';
	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import type { PageData as CreateCategoryPageDate } from '../../categories/create/$types';
	import type { PageData as ArchivedCategoriesPageData } from '../../categories/archived/$types';
	import LucideFolderPlus from '~icons/lucide/folder-plus';
	import LucideChevronsRight from '~icons/lucide/chevrons-right';
	import LucideChevronsLeft from '~icons/lucide/chevrons-left';
	import LucideFolderArchive from '~icons/lucide/folder-archive';
	import LucideTimer from '~icons/lucide/timer';
	import LucideStars from '~icons/lucide/stars';
	import { cn } from '$lib/utils';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { formatDistanceToNow } from 'date-fns';
	import { Separator } from '$lib/components/ui/separator';

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

	const [archivedAction, archivedData, archivedIsOpen] =
		createShallowRoute<ArchivedCategoriesPageData>();

	let lastUpdate = new Date();
	let lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });

	let timer = setInterval(() => {
		lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });
	}, 1000);

	$: if (data) {
		clearInterval(timer);
		lastUpdate = new Date();
		timer = setInterval(() => {
			lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });
		}, 1000);
	}
</script>

<svelte:head>
	<title>Budget | {data.localDate}</title>
</svelte:head>

<div
	class="mb-6 flex scroll-m-20 flex-wrap items-center gap-1 text-2xl font-bold tracking-tight lg:text-3xl"
>
	<h1 class="mr-2">Budget</h1>

	<div class="flex items-center gap-2">
		<a
			href="/budget/{data.previousMonth}"
			class={buttonVariants({
				size: 'icon',
				variant: 'ghost',
				class: 'text-primary'
			})}
		>
			<LucideChevronsLeft />
			<span class="sr-only">Go to previous month</span>
		</a>

		<span class="text-primary">{data.localDate}</span>

		<a
			href="/budget/{data.nextMonth}"
			class={buttonVariants({
				size: 'icon',
				variant: 'ghost',
				class: 'text-primary'
			})}
		>
			<LucideChevronsRight />
			<span class="sr-only">Go to next month</span>
		</a>
	</div>

	<div
		class="ml-auto flex items-center gap-1 text-xs font-semibold tracking-normal text-muted-foreground"
	>
		<LucideTimer />
		Last Updated: {lastUpdated}
	</div>
</div>

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

		{@const accounts = data.accounts.filter((a) => {
			if (teamId === null) return a.team === null;
			return a.team?.id === teamId;
		})}

		<Tabs.Content value={team?.id.toString() ?? String(null)}>
			<div class="flex flex-col gap-8 pt-8">
				<div class="hidden justify-end gap-4 md:flex">
					{#if accounts}
						<AccountsTeaser {accounts} />
					{/if}

					<Separator orientation="vertical" class="h-full"/>

					<BudgetBalance
						sum={data.sleepingMoney.teams.find(
							(t) => t.id === Number(selectedTeamId)
						)?.sum ?? data.sleepingMoney.personal}
					/>
				</div>

				{#key teamId}
					<BudgetTable
						{budget}
						currentOrder={completeBudget.map(({ id }) => id)}
					/>
				{/key}
			</div>
		</Tabs.Content>
	{/each}
</Tabs.Root>

<div class="mt-4 flex flex-wrap items-start justify-between">
	{#if data.archivedCategories.length > 0}
		<a
			href="/categories/archived"
			use:archivedAction={$page.url}
			class={cn(
				buttonVariants({
					variant: 'ghost',
					size: 'sm'
				})
			)}
		>
			<LucideFolderArchive class="mr-2" />
			{data.archivedCategories.length} archived categories
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
	open={$archivedIsOpen}
	onOpenChange={(open) => {
		if (!open) history.back();
	}}
>
	<Sheet.Content side="left" class="sm:max-w-xl">
		{#if $archivedData}
			<ScrollArea
				orientation="vertical"
				class="my-4 h-[calc(100vh-3rem)] pb-6 pl-2"
			>
				<ArchivedCategoriesPage data={$archivedData} />
			</ScrollArea>
		{/if}
	</Sheet.Content>
</Sheet.Root>
