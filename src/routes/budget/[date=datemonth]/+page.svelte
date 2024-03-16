<script lang="ts">
	import { getMonthYear } from '$lib/components/date.utils';
	import Feather from '$lib/components/feather.svelte';
	import BudgetForm from './budget.form.svelte';
	import {
		formatFractionToLocaleCurrency,
		getPercentage
	} from '$lib/components/utils';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head>
	<title>Budget | {data.formattedDate}</title>
</svelte:head>

<div class="flex my-8 justify-between">
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold">Budget {data.formattedDate}</h1>
		<div class="flex gap-2">
			<a
				href="/budget/{data.previousMonth}"
				class="btn btn-blue btn-sm font-mono"
			>
				<Feather name="chevrons-left" />
				Prev
			</a>

			{#if data.formattedDate !== getMonthYear(new Date())}
				<a href="/budget" class="btn btn-ghost btn-sm">today</a>
			{/if}

			<a href="/budget/{data.nextMonth}" class="btn btn-blue btn-sm font-mono">
				Next
				<Feather name="chevrons-right" />
			</a>
		</div>
	</div>

	<div class="flex flex-col items-end">
		<h2 class="text-muted font-bold">To Be Assigned</h2>
		<span class="font-semibold text-xl tabular-nums">
			{formatFractionToLocaleCurrency(data.sleepingMoney.personal)}
		</span>
	</div>
</div>

<table class="table table-fixed border-collapse">
	<thead>
		<tr class="text-muted">
			<th scope="col" class="text-left px-2 py-4">Category Name</th>
			<th scope="col" class="text-right px-2 py-4">Budget</th>
			<th scope="col" class="text-right px-2 py-4">Activity</th>
			<th scope="col" class="text-right px-2 py-4">Available</th>
		</tr>
	</thead>

	<tbody>
		{#each data.budget as budget (budget.id)}
			<tr>
				<td class="p-2">
					<div class="flex flex-col">
						<span>{budget.name}</span>

						{#if budget.goal}
							{@const goalPercentage = Math.min(
								getPercentage(budget.rest, budget.goal),
								100
							)}
							<div
								style="--goal-percentage: {goalPercentage}%;"
								class={`text-muted text-xs flex gap-2 items-center ${
									goalPercentage >= 100 ? 'text-green dark:text-green-dark' : ''
								}`}
							>
								<div
									class="relative rounded-full h-1 grow max-w-xs bg-base-100 dark:(bg-base-900)"
								>
									<div
										class="absolute left-0 h-1 w-[--goal-percentage] bg-green dark:bg-green-dark rounded-full transition-all duration-1000"
									/>
								</div>

								<Feather name="award" />

								<span class="tabular-nums font-semibold">
									Goal: {formatFractionToLocaleCurrency(budget.goal)}
								</span>
							</div>
						{/if}
					</div>
				</td>

				<td class="text-right p-2">
					<a
						href="#target-budget-input-{budget.id}"
						class="py-1 px-4 tabular-nums font-semibold border border-ui-normal rounded hover:(fg) dark:(border-ui-normal-dark)"
					>
						{formatFractionToLocaleCurrency(budget.budget || 0)}
					</a>
				</td>

				<td class="text-right tabular-nums font-semibold p-2">
					{formatFractionToLocaleCurrency(budget.activity)}
				</td>

				<td class="text-right tabular-nums font-semibold p-2">
					{formatFractionToLocaleCurrency(budget.rest)}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#each data.budget as budget (budget.id)}
	<BudgetForm {budget} />
{/each}
