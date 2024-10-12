<script lang="ts">
	import type { PageData } from './$types';
	import Stats from './category.stats.svelte';
	import { cn } from '$lib/utils';
	import LucideCalendarPlus2 from '~icons/lucide/calendar-plus-2';
	import LucideUsersRound from '~icons/lucide/users-round';
	import LucideScroll from '~icons/lucide/scroll';
	import { Separator } from '$lib/components/ui/separator';
	import { buttonVariants } from '$lib/components/ui/button';
	import UpdateForm from './category.form.update.svelte';
	import GoalForm from './category.form.goal.svelte';
	import RetireForm from './category.form.retire.svelte';
	import MoveTransactionsForm from './category.form.move.svelte';

	import LucideStars from '~icons/lucide/stars';

	export let data: PageData;

	$: ({ category, stats, budget } = data);

	$: formattedDate = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(new Date(category.createdAt));
</script>

<svelte:head>
	<title>Category | {category.name}</title>
</svelte:head>

<h2 class="text-3xl font-semibold leading-none tracking-tight">
	{category.name}
</h2>

<div
	class="mt-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground md:gap-3"
>
	<div class="flex items-center gap-1" title="Date of Creation">
		<LucideCalendarPlus2 />
		<span>{formattedDate}</span>
	</div>

	{#if category.description}
		<div class="flex items-center gap-1" title="Category Description">
			<LucideScroll />
			<span>
				{category.description}
			</span>
		</div>
	{/if}

	{#if category.team}
		<a
			href="/teams/{category.team.id}"
			class={cn(
				buttonVariants({ variant: 'link' }),
				'flex h-fit items-center gap-1 p-0'
			)}
		>
			<LucideUsersRound />
			<span>{category.team.name}</span>
		</a>
	{/if}
</div>

<Separator class="my-8" />

<div class="flex gap-16">
	<div class="flex w-2/3 flex-col gap-6">
		<Stats {stats} {budget} />

		<div class="flex w-full grow rounded-md border border-dashed border-border">
			<span class="m-auto flex items-center gap-2 italic text-muted-foreground">
				<LucideStars />
				Graphs coming soon...
			</span>
		</div>
	</div>

	<div class="flex w-1/3 flex-col gap-8">
		{#if category.retired}
			<RetireForm data={data.retireForm} {category} {stats} />
		{:else}
			<UpdateForm data={data.updateForm} />

			<GoalForm data={data.goalForm} {budget} />

			<RetireForm data={data.retireForm} {category} {stats} />

			<MoveTransactionsForm
				data={data.moveTransactionsForm}
				categories={data.otherCategories}
				{category}
			/>
		{/if}
	</div>
</div>
