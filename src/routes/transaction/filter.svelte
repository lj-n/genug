<script lang="ts">
	import { page } from '$app/stores';
	import Feather from '$lib/components/feather.svelte';
	import type {
		SelectUserAccount,
		SelectUserCategory
	} from '$lib/server/schema/tables';
	import { flip } from 'svelte/animate';

	export let categories: SelectUserCategory[];
	export let accounts: SelectUserAccount[];

	$: filterCategories = $page.url.searchParams.getAll('c');
	$: filterAccounts = $page.url.searchParams.getAll('a');

	$: filterCountCategories = filterCategories.length;
	$: filterCountAccounts = filterAccounts.length;
	$: filterCount = filterCountCategories + filterCountAccounts;

	$: sortedCategories = categories.sort((a, b) => {
		const aId = a.id.toString();
		const bId = b.id.toString();

		const aIsSelected = filterCategories.includes(aId);
		const bIsSelected = filterCategories.includes(bId);

		return aIsSelected && !bIsSelected
			? -1
			: !aIsSelected && bIsSelected
			? 1
			: 0;
	});
	$: sortedAccounts = accounts.sort((a, b) => {
		const aId = a.id.toString();
		const bId = b.id.toString();

		const aIsSelected = filterAccounts.includes(aId);
		const bIsSelected = filterAccounts.includes(bId);

		return aIsSelected && !bIsSelected
			? -1
			: !aIsSelected && bIsSelected
			? 1
			: 0;
	});
</script>

<details class="group my-4 w-full open:ring-1 open:ring-ui rounded-lg">
	<summary
		class="select-none btn btn-ghost group-open:w-full cursor-pointer group-open:rounded-b-none group-open:border-b border-ui"
	>
		<Feather name="filter" class={filterCount > 0 ? 'fill-tx-2' : ''} />
		Filter
		{#if filterCount > 0}
			({filterCount})
		{/if}
		<Feather name="chevron-up" class="hidden ml-auto group-open:block" />
	</summary>

	<div class="p-4 flex flex-col gap-4">
		<blockquote class="w-fit mx-auto">
			Click the labels to select/deselect filter. Click the reset button on the
			bottom to deselect all.
		</blockquote>

		<div class="flex flex-col gap-1">
			<span class="font-semibold">
				Accounts
				{#if filterCountAccounts > 0}
					({filterCountAccounts})
				{/if}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each sortedAccounts as account (account.id)}
					<form
						action="/transaction{$page.url.search}"
						method="get"
						animate:flip={{ duration: 200 }}
					>
						{#each categories as category (category.id)}
							<input
								type="checkbox"
								name="c"
								value={category.id}
								checked={filterCategories.includes(category.id.toString())}
								class="hidden"
							/>
						{/each}

						{#each accounts.filter((c) => c.id !== account.id) as otherAccount (otherAccount.id)}
							<input
								type="checkbox"
								name="a"
								value={otherAccount.id}
								checked={filterAccounts.includes(otherAccount.id.toString())}
								class="hidden"
							/>
						{/each}

						<input
							type="checkbox"
							name="a"
							value={account.id}
							class="hidden peer"
							checked={!filterAccounts.includes(account.id.toString())}
						/>
						<button
							type="submit"
							class="peer-checked:border-ui border bg-bg-2 hover:bg-ui border-blue-light px-2 py-0.5 rounded-full text-xs"
							aria-label="Remove or Add this Account to Filters"
						>
							{account.name}
						</button>
					</form>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-1">
			<span class="font-semibold">
				Categories
				{#if filterCountCategories > 0}
					({filterCountCategories})
				{/if}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each sortedCategories as category (category.id)}
					<form
						action="/transaction{$page.url.search}"
						method="get"
						animate:flip={{ duration: 200 }}
					>
						{#each accounts as account (account.id)}
							<input
								type="checkbox"
								name="a"
								value={account.id}
								checked={filterAccounts.includes(account.id.toString())}
								class="hidden"
							/>
						{/each}

						{#each categories.filter((c) => c.id !== category.id) as otherCategory (otherCategory.id)}
							<input
								type="checkbox"
								name="c"
								value={otherCategory.id}
								checked={filterCategories.includes(otherCategory.id.toString())}
								class="hidden"
							/>
						{/each}

						<input
							type="checkbox"
							name="c"
							value={category.id}
							class="hidden peer"
							checked={!filterCategories.includes(category.id.toString())}
						/>
						<button
							type="submit"
							class="peer-checked:border-ui border bg-bg-2 hover:bg-ui border-blue-light px-2 py-0.5 rounded-full text-xs"
							aria-label="Remove or add this category to filters"
						>
							{category.name}
						</button>
					</form>
				{/each}
			</div>
		</div>

		{#if filterCount > 0}
			<form
				action="/transaction{$page.url.search}"
				method="get"
				class="mx-auto"
			>
				{#each categories as category}
					<input
						type="checkbox"
						name="c"
						value={category.id}
						checked={false}
						class="hidden"
					/>
				{/each}
				{#each accounts as account}
					<input
						type="checkbox"
						name="a"
						value={account.id}
						checked={false}
						class="hidden"
					/>
				{/each}

				<button type="submit" class="btn btn-ghost btn-sm">
					<Feather name="rotate-ccw" />
					reset
				</button>
			</form>
		{/if}
	</div>
</details>
