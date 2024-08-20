<script lang="ts">
	import type { PageData } from './$types';
	import { flip } from 'svelte/animate';
	import { enhance } from '$app/forms';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import Feather from '$lib/components/feather.svelte';
	import Pagination from './transaction.pagination.svelte';
	import Filter from './transaction.filter.svelte';
	import AccountBalances from './transaction.balances.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>Transactions</title>
</svelte:head>

<h1 class="mt-4 text-2xl font-bold">Transactions</h1>

<div class="m-4 flex justify-end">
	<details class="max-w-md grow">
		<summary class="mb-2 ml-auto w-fit cursor-pointer text-right text-sm">
			Show Balances
		</summary>
		<AccountBalances accounts={data.accounts} />
	</details>
</div>

<div class="md:(flex-row gap-2) flex flex-col items-center gap-4">
	<Filter data={data.accounts} label="Accounts" key="accounts" />
	<Filter data={data.categories} label="Categories" key="categories" />
	{#if data.teams}
		<Filter
			data={data.teams.map(({ team }) => team)}
			label="Teams"
			key="teams"
		/>
	{/if}

	<a
		href="/transactions/transfer"
		class="btn btn-blue md:(w-fit my-0) my-4 ml-auto w-full text-xs"
	>
		<Feather name="shuffle" />
		Transfer Transactions
	</a>
	<a
		href="/transactions/create"
		class="btn btn-green md:(w-fit my-0) my-4 w-full text-xs"
	>
		<Feather name="plus-circle" />
		New Transaction
	</a>
</div>

<table class="lg:(mt-0 w-full) mt-4 block table border-collapse">
	<thead class="sr-only lg:not-sr-only">
		<tr class="lg:(table-row text-sm) block">
			<th scope="col" class="px-2 py-4 text-left">Date</th>
			<th scope="col" class="px-2 py-4 text-left">Account</th>
			<th scope="col" class="px-2 py-4 text-left">Category</th>
			<th scope="col" class="px-2 py-4 text-left">Description</th>
			<th scope="col" class="px-2 py-4 text-right">Flow</th>
			<th scope="col" class="px-2 py-4 text-right">Validated</th>
			<th scope="col" class="sr-only">Actions</th>
		</tr>
	</thead>

	<tbody class="flex flex-col gap-4 lg:table-row-group">
		{#each data.transactions as transaction (transaction.id)}
			<tr
				animate:flip={{ duration: 200 }}
				class="border-ui-normal lg:(border-none table-row) lg:[&>td]:hover:fg flex flex-wrap border-b pb-4"
			>
				<td
					class="lg:(text-normal rounded-l-lg) order-3 mr-4 p-2 text-base text-sm text-muted"
				>
					{transaction.date}
				</td>

				<td class="lg:(text-normal p-2) order-4 text-base text-sm text-muted">
					{transaction.account?.name}
				</td>

				<td
					class="lg:(w-unset text-normal p-2) order-1 w-2/3 text-base font-normal font-semibold"
				>
					{transaction.category?.name || 'No Category'}
				</td>

				<td class="lg:(w-unset p-2) order-5 my-2 w-full text-sm text-muted">
					{transaction.description || ''}
				</td>

				<td
					class="lg:(w-unset p-2) order-6 w-1/2 text-right text-base text-lg font-semibold tabular-nums"
				>
					{formatFractionToLocaleCurrency(transaction.flow)}
				</td>

				<td class="lg:(w-unset p-2) order-2 w-1/3 text-right">
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
								class="dark:(text-green-dark border-green-dark hover:bg-green-dark/05) hover:bg-green/05 rounded-full border border-green px-2 py-0.5 text-xs font-semibold text-green"
							>
								validated
							</button>
						{:else}
							<button
								type="submit"
								class="dark:(text-yellow-dark border-yellow-dark hover:bg-yellow-dark/05) hover:bg-yellow/05 rounded-full border border-yellow px-2 py-0.5 text-xs font-semibold text-yellow"
							>
								not validated
							</button>
						{/if}
					</form>
				</td>

				<td class="lg:(w-unset rounded-r-lg) order-7 w-1/2 p-2 text-right">
					<div class="ml-auto flex w-fit items-center gap-2">
						<a
							href="/transactions/{transaction.id}"
							title="Edit"
							class="btn-sm hover:text-normal text-muted"
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
								class="btn-sm hover:text-normal text-muted"
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
