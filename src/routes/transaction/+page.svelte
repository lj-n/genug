<script lang="ts">
	import type { PageData } from './$types';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import Feather from '$lib/components/feather.svelte';
	import CreateForm from './create.form.svelte';
	import Pagination from './pagination.svelte';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import Filter from './filter.svelte';
	export let data: PageData;
</script>

<CreateForm accounts={data.accounts} categories={data.categories} />

<h1 class="my-4 text-2xl font-bold">Transactions</h1>

<Filter categories={data.categories} accounts={data.accounts} />

<table class="block lg:(table w-full)">
	<thead class="sr-only lg:not-sr-only">
		<tr class="block lg:(table-row text-sm)">
			<th scope="col" class="text-left px-2 py-4">Date</th>
			<th scope="col" class="text-left px-2 py-4">Account</th>
			<th scope="col" class="text-left px-2 py-4">Category</th>
			<th scope="col" class="text-left px-2 py-4">Description</th>
			<th scope="col" class="text-right px-2 py-4">Flow</th>
			<th scope="col" class="text-right px-2 py-4">Validated</th>
			<th scope="col" class="sr-only">Actions</th>
		</tr>
	</thead>

	<tbody>
		{#each data.transactions as transaction (transaction.id)}
			<tr
				animate:flip={{ duration: 200 }}
				class="block lg:table-row lg:[&>td]:hover:fg"
			>
				<td data-label="Date" class="lg:(p-2 rounded-l-lg)">
					{transaction.date}
				</td>
				<td data-label="Account" class="lg:p-2">
					{transaction.account.name}
				</td>
				<td data-label="Category" class="lg:(p-2)">
					{transaction.category?.name || 'No Category'}
				</td>
				<td data-label="Description" class="lg:(p-2)">
					{transaction.description}
				</td>
				<td
					data-label="Flow"
					class="lg:(text-right p-2) tabular-nums font-semibold"
				>
					{formatFractionToLocaleCurrency(transaction.flow)}
				</td>
				<td data-label="Validated" class="lg:(text-right p-2)">
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
								class="font-semibold text-xs border text-green border-green dark:(text-green-dark border-green-dark hover:bg-green-dark/05) px-2 py-0.5 rounded-full hover:bg-green/05"
							>
								validated
							</button>
						{:else}
							<button
								type="submit"
								class="font-semibold text-xs border text-orange border-orange dark:(text-orange-dark border-orange-dark hover:bg-orange-dark/05) px-2 py-0.5 rounded-full hover:bg-orange/05"
							>
								not validated
							</button>
						{/if}
					</form>
				</td>
				<td data-label="Actions" class="lg:(p-2 rounded-r-lg)">
					<div class="flex gap-2 items-center w-fit ml-auto">
						<a
							href="/transaction/{transaction.id}"
							title="Edit"
							class="btn-sm text-muted hover:text-normal"
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
								class="btn-sm text-muted hover:text-normal"
								title="Delete"
								aria-label="Delete Transaction"
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

<Pagination />

<style>
	/* @media (min-width: theme(screens.lg)) {
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
			@apply border-none first:rounded-bl-lg last:rounded-br-lg;
		}

		td[data-label='Flow'],
		td[data-label='Validated'],
		td[data-label='Actions'] {
			@apply text-right;
		}
	}

	@media (max-width: theme(screens.lg)) {
		.table-wrapper {
			@apply border border-ui rounded-lg;
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
			@apply flex flex-wrap border-b border-ui last:border-none;
		}

		tbody tr td {
			@apply bg-bg;
		}

		td[data-label='Category'] {
			@apply order-1 w-1/2;
		}
		td[data-label='Validated'] {
			@apply order-2 ml-auto;
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
	} */
</style>
