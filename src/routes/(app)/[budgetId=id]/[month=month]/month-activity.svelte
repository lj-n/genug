<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	import type { PageData } from './$types';

	let { category }: { category: PageData['categories'][number] } = $props();

	let activity = $state(getThisMonthActivityOverview(category));

	async function getThisMonthActivityOverview(category: PageData['categories'][number]) {
		const res = await fetch(
			resolve(`/(app)/[budgetId=id]/[month=month]/activity?category=${category.id}`, {
				budgetId: page.params.budgetId!,
				month: page.params.month!
			})
		);
		return res.json() as Promise<[{ amount: number; date: Date; id: string }]>;
	}
</script>

{#await activity}
	<div>Loading activity...</div>
{:then data}
	{#each data as { amount, date, id } (id)}
		<div>
			<span>{date.toLocaleDateString()}</span>
			<span>{amount}</span>
		</div>
	{/each}
{:catch error}
	<div>Error loading activity: {error.message}</div>
{/await}
