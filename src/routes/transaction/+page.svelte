<script lang="ts">
	import type { PageData } from './$types';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import Feather from '$lib/components/feather.svelte';
	import CreateForm from './create.form.svelte';
	import { flip } from 'svelte/animate';
	import { fade, scale } from 'svelte/transition';
	import { enhance } from '$app/forms';
	export let data: PageData;
</script>

<CreateForm accounts={data.accounts} categories={data.categories} />

<h1 class="my-4 text-2xl">Transactions</h1>

<div class="table-wrapper mb-8 shadow">
	<table>
		<thead class="sr-only lg:not-sr-only">
			<tr>
				<th scope="col" class="text-left">Date</th>
				<th scope="col" class="text-left">Account</th>
				<th scope="col" class="text-left">Category</th>
				<th scope="col" class="text-left">Description</th>
				<th scope="col" class="text-right">Flow</th>
				<th scope="col" class="text-right">Validated</th>
				<th />
			</tr>
		</thead>
		<tbody>
			{#each data.transactions as transaction (transaction.id)}
				<tr animate:flip={{ duration: 300 }} transition:fade={{duration: 300}}>
					<td data-label="Date" class="order-5">{transaction.date}</td>
					<td data-label="Account" class="order-6"
						>{transaction.account.name}</td
					>
					<td data-label="Category" class="order-1">
						{transaction.category?.name || 'No Category'}
					</td>
					<td data-label="Description" class="order-7 text-tx-2">
						{transaction.description}
					</td>
					<td data-label="Flow" class="order-3 tabular-nums font-semibold">
						{formatFractionToLocaleCurrency(transaction.flow)}
					</td>
					<td data-label="Validated" class="order-2">
						<form action="?/validate" method="post" use:enhance>
							<input
								type="hidden"
								name="validated"
								value={!transaction.validated}
							/>
							<input type="hidden" name="id" value={transaction.id} />
							{#if transaction.validated}
								<button
									type="submit"
									class="text-green-light font-semibold text-sm"
								>
									validated
								</button>
							{:else}
								<button type="submit" class="text-tx-2 text-sm">
									not validated
								</button>
							{/if}
						</form>
					</td>
					<td data-label="Actions" class="order-8">
						<div class="inline-flex gap-2">
							<a
								href="/transaction/edit/{transaction.id}"
								title="Edit Transaction"
								class="btn btn-ghost btn-sm"
							>
								<Feather name="edit" />
							</a>

							<form
								action="?/remove"
								method="post"
								use:enhance={({ cancel }) => {
									if (!window.confirm('Delete transaction?')) {
										cancel();
									}

									return async ({ update }) => {
										update();
									};
								}}
							>
								<input type="hidden" name="id" value={transaction.id} />
								<button
									type="submit"
									class="btn btn-ghost btn-sm text-red-light"
									aria-label="Remove Transaction"
								>
									<Feather name="trash" />
								</button>
							</form>
						</div>
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
			@apply border-collapse w-full;
		}

		thead tr th {
			@apply py-2 px-4 bg-bg-2 first:rounded-tl-lg last:rounded-tr-lg;
		}

		tbody tr td {
			@apply py-2 px-4 border-b border-ui bg-bg;
		}

		tbody tr:last-child td {
			@apply border-none;
		}

		td[data-label='Flow'],
		td[data-label='Validated'],
		td[data-label='Actions'] {
			@apply text-right;
		}
	}

	@media (max-width: theme(screens.lg)) {
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
			@apply flex flex-wrap border-b border-ui last:border-none;
		}

		td[data-label='Category'] {
			@apply order-1 w-1/2;
		}
		td[data-label='Validated'] {
			@apply order-2 ml-auto px-4 rounded-full border border-green-light;
		}

		td[data-label='Flow'] {
			@apply order-3 w-full tabular-nums font-bold text-xl leading-6;
		}

		td[data-label='Date'] {
			@apply order-4 text-sm mt-1 text-tx-2;
			@apply after:content-["|"] after:mx-2;
		}
		td[data-label='Account'] {
			@apply order-5 text-sm mt-1 text-tx-2;
		}

		td[data-label='Description'] {
			@apply order-6 w-full text-sm my-2 text-tx-2;
		}

		td[data-label='Actions'] {
			@apply order-7 ml-auto;
		}
	}
</style>
