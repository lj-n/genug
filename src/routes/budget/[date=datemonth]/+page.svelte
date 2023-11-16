<script lang="ts">
	import { enhance } from '$app/forms';
	import { getMonthYear } from '$lib/components/date.utils';
	import Feather from '$lib/components/feather.svelte';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency
	} from '$lib/components/utils';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<h1 class="text-5xl mx-auto mt-8">{data.formattedDate}</h1>
<div class="mt-4 mb-8 mx-auto flex gap-4">
	<a href="/budget/{data.previousMonth}" class="btn btn-blue btn-sm">
		<Feather name="chevrons-left" />
		Previous
	</a>

	{#if data.formattedDate !== getMonthYear(new Date())}
		<a href="/budget" class="btn btn-ghost btn-sm">today</a>
	{/if}

	<a href="/budget/{data.nextMonth}" class="btn btn-blue btn-sm">
		Next
		<Feather name="chevrons-right" />
	</a>
</div>

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				<th scope="col" class="text-left">Category Name</th>
				<th scope="col" class="text-right">Budget</th>
				<th scope="col" class="text-right">Activity</th>
				<th scope="col" class="text-right">Available</th>
			</tr>
		</thead>
		<tbody>
			{#each data.budgets as budget (budget.category.id)}
				<tr>
					<td>
						<div class="flex flex-col">
							<span>{budget.category.name}</span>
							{#if budget.category.goal}
								<span>Goal: {budget.category.goal}</span>
							{/if}
						</div>
					</td>
					<td class="text-right tabular-nums font-semibold">
						<details class="group border-none">
							<summary
								class="hover:ring-1 ring-ui rounded-lg border-none select-none list-none cursor-pointer"
							>
								<span>{formatFractionToLocaleCurrency(budget.budget)}</span>
							</summary>
							<form
								method="post"
								class="flex gap-2 justify-end"
								use:enhance={() => {
									return async ({ update, formElement }) => {
										formElement.parentElement?.removeAttribute('open');
										update();
									};
								}}
							>
								<input
									type="hidden"
									name="categoryId"
									value={budget.category.id}
								/>

								<input
									type="text"
									name="budget"
									class="input input-sm max-w-[5rem]"
									aria-label="Update Budget Value"
									value={budget.budget}
									title={currencyInputProps.title}
									pattern={currencyInputProps.pattern}
								/>

								<button type="submit" class="btn btn-sm btn-blue">
									update
								</button>
							</form>
						</details>
					</td>
					<td class="text-right tabular-nums font-semibold">
						<span>{formatFractionToLocaleCurrency(budget.activity)}</span>
					</td>
					<td class="text-right tabular-nums font-semibold">
						<span>{formatFractionToLocaleCurrency(budget.rest)}</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="postcss">
	@media (min-width: theme(screens.lg)) {
		.table-wrapper {
			@apply border border-ui rounded-lg;
		}

		table {
			@apply border-collapse w-full table-fixed;
		}

		thead tr th {
			@apply py-2 px-4 bg-bg-2 first:rounded-tl-lg last:rounded-tr-lg;
		}

		tbody tr td {
			@apply py-2 px-4 border-b border-ui bg-bg h-full;
		}

		tbody tr:last-child td {
			@apply border-none first:rounded-bl-lg last:rounded-br-lg;
		}
	}

	@media (max-width: theme(screens.lg)) {
	}
</style>
