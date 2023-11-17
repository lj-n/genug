<script lang="ts">
	import { enhance } from '$app/forms';
	import { getMonthYear } from '$lib/components/date.utils';
	import Feather from '$lib/components/feather.svelte';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency,
		getPercentage
	} from '$lib/components/utils';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	let table: HTMLTableElement;

	onMount(() => {
		const details = table?.querySelectorAll('details');

		function handleToggle(this: HTMLDetailsElement) {
			if (!this.open) {
				return;
			}
			/** Close all other details in table */
			details.forEach((element) => {
				if (element !== this) {
					element.removeAttribute('open');
				}
			});
		}

		details.forEach((element) => {
			element.addEventListener('toggle', handleToggle);
		});
		return () => {
			details.forEach((element) => {
				element.removeEventListener('toggle', handleToggle);
			});
		};
	});
</script>

<h1 class="text-5xl mx-auto mt-8">{data.formattedDate}</h1>
<div class="mt-4 mb-8 mx-auto flex gap-4">
	<a href="/budget/{data.previousMonth}" class="btn btn-blue btn-sm font-mono">
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

<div class="table-wrapper">
	<table bind:this={table}>
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
					<td data-label="Name">
						<div class="flex flex-col gap-2">
							<span>{budget.category.name}</span>
							{#if budget.category.goal}
								<div
									style="--goal-percentage: {Math.min(
										getPercentage(budget.rest, budget.category.goal),
										100
									)}%;"
									class="goal lg:flex items-center text-sm gap-1 relative hidden"
								>
									<Feather name="award" />
									<span class="tabular-nums font-semibold">
										Goal: {formatFractionToLocaleCurrency(budget.category.goal)}
									</span>
								</div>
							{/if}
						</div>
					</td>
					<td data-label="Budget" class="text-right tabular-nums font-semibold">
						<details class="group border-none">
							<summary class="border-none select-none list-none cursor-pointer">
								<span>{formatFractionToLocaleCurrency(budget.budget)}</span>
							</summary>
						</details>
						<form
							method="post"
							class="flex gap-2 justify-end"
							use:enhance={() => {
								return async ({ update, formElement }) => {
									formElement.previousElementSibling?.removeAttribute('open');
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
					</td>
					<td
						data-label="Activity"
						class="text-right tabular-nums font-semibold"
					>
						<span>{formatFractionToLocaleCurrency(budget.activity)}</span>
					</td>
					<td data-label="Rest" class="text-right tabular-nums font-semibold">
						<span>{formatFractionToLocaleCurrency(budget.rest)}</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="postcss">
	details + form {
		max-height: 0;
		overflow: hidden;
		transition: max-height 200ms ease-out;
	}
	details[open] + form,
	form:focus-within {
		max-height: 2rem;
	}

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

		div.goal {
			@apply pb-2;
			@apply after:absolute after:h-1 after:bg-green-light after:rounded-full after:bottom-0 after:w-[--goal-percentage];
			@apply before:absolute before:h-1 before:bg-ui before:rounded-full before:bottom-0 before:w-full;
		}
	}

	@media (max-width: theme(screens.lg)) {
		table thead {
			@apply sr-only;
		}

		table,
		tbody,
		tbody tr {
			display: block;
		}

		table {
			@apply table-fixed w-full max-w-2xl mx-auto;
		}

		tbody {
			@apply flex flex-col gap-2;
		}

		tbody tr {
			@apply px-2 py-4;
			@apply grid grid-cols-2 border-b border-ui last:border-none gap-y-4;
		}

		tbody tr td {
			@apply bg-bg;
		}

		td[data-label='Name'] {
			@apply order-1 text-xl font-semibold;
		}

		td[data-label='Rest'] {
			@apply order-2 text-xl ml-auto flex flex-col items-end;
		}

		td[data-label='Rest'],
		td[data-label='Activity'],
		td[data-label='Budget'] {
			@apply before:content-[attr(data-label)] before:font-normal before:text-xs before:rounded-full before:bg-bg-2 before:px-2;
		}

		td[data-label='Budget'] {
			@apply order-3 text-left;
		}
		td[data-label='Budget'] form {
			@apply justify-start;
		}

		td[data-label='Activity'] {
			@apply order-4 ml-auto flex flex-col items-end;
		}
	}
</style>
