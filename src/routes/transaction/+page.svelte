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

<Filter categories={data.categories} accounts={data.accounts} />

<h1 class="my-4 text-2xl font-bold">Transactions</h1>

<table class="block lg:(table border-collapse w-full)">
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

	<tbody class="flex flex-col gap-4 lg:table-row-group">
		{#each data.transactions as transaction (transaction.id)}
			<tr
				animate:flip={{ duration: 200 }}
				class="flex flex-wrap border-b pb-4 border-ui-normal lg:(border-none table-row) lg:[&>td]:hover:fg"
			>
				<td
					class="order-3 text-muted text-sm mr-4 lg:(text-normal text-base p-2 rounded-l-lg)"
				>
					{transaction.date}
				</td>

				<td class="order-4 text-muted text-sm lg:(text-normal text-base p-2)">
					{transaction.account.name}
				</td>

				<td
					class="order-1 w-2/3 font-semibold lg:(w-unset text-normal text-base font-normal p-2)"
				>
					{transaction.category?.name || 'No Category'}
				</td>

				<td
					class="order-5 w-full my-2 text-muted text-sm lg:(w-unset text-normal text-base p-2)"
				>
					{transaction.description}
				</td>

				<td
					class="order-6 w-1/2 tabular-nums font-semibold text-lg lg:(w-unset text-base text-right p-2)"
				>
					{formatFractionToLocaleCurrency(transaction.flow)}
				</td>

				<td class="order-2 w-1/3 text-right lg:(w-unset p-2)">
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
								class="font-semibold text-xs border text-yellow border-yellow dark:(text-yellow-dark border-yellow-dark hover:bg-yellow-dark/05) px-2 py-0.5 rounded-full hover:bg-yellow/05"
							>
								not validated
							</button>
						{/if}
					</form>
				</td>

				<td class="order-7 w-1/2 text-right lg:(w-unset p-2 rounded-r-lg)">
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
