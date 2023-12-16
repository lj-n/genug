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

	$: sortedCategories = categories.sort(sortBySelected(filterCategories));
	$: sortedAccounts = accounts.sort(sortBySelected(filterAccounts));

	function sortBySelected<T extends { id: number }>(arr: string[]) {
		return (a: T, b: T) => {
			const aId = a.id.toString();
			const bId = b.id.toString();

			const aIsSelected = arr.includes(aId);
			const bIsSelected = arr.includes(bId);

			return aIsSelected && !bIsSelected
				? -1
				: !aIsSelected && bIsSelected
				? 1
				: 0;
		};
	}
</script>

<div
	class="border rounded-xl border-ui-normal dark:border-ui-normal-dark my-4 p-6"
>
	<h2 class="font-semibold flex items-center gap-1">
		<Feather name="filter" />
		Filter Accounts
		{#if filterCountAccounts > 0}
			({filterCountAccounts})
		{/if}
	</h2>

	<p class="text-muted mb-2 text-sm">
		Select/Deselect accounts by clicking the labels
	</p>

	<div class="flex flex-wrap gap-1">
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
					class="peer-checked:(border-ui-normal) px-2 py-0.5 rounded text-sm border fg border-orange dark:(border-orange-dark peer-checked:border-ui-normal-dark)"
					aria-label="Remove or Add this Account to Filters"
				>
					{account.name}
				</button>
			</form>
		{/each}
	</div>

	<h2 class="font-semibold flex items-center gap-1 mt-6">
		<Feather name="filter" />
		Filter Categories
		{#if filterCountCategories > 0}
			({filterCountCategories})
		{/if}
	</h2>

	<p class="text-muted mb-2 text-sm">
		Select/Deselect categories by clicking the labels
	</p>

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
					class="peer-checked:(border-ui-normal) px-2 py-0.5 rounded text-sm border fg border-blue dark:(border-blue-dark peer-checked:border-ui-normal-dark)"
					aria-label="Remove or add this category to filters"
				>
					{category.name}
				</button>
			</form>
		{/each}
	</div>
</div>

<!-- <details class="group my-4 rounded-lg w-fit text-sm">
	<summary class="select-none btn btn-sm btn-ghost">
		<Feather
			name="filter"
			class={filterCount > 0 ? 'fill-base-100 dark:fill-base-800' : ''}
		/>
		Filter
		{#if filterCount > 0}
			({filterCount})
		{/if}
		<Feather name="chevron-up" class="hidden ml-auto group-open:block" />
	</summary>

	<div class="p-2 flex flex-col gap-2">
		<span class="text-muted">
			Click the labels to select/deselect accounts and categories.
		</span>

		<form action="/transaction{$page.url.search}" method="get" class="my-2">
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

			<button type="submit" class="btn btn-sm text-xs">
				<Feather name="rotate-ccw" />
				Reset All Filter
			</button>
		</form>

		<div class="flex flex-col gap-1">
			<span class="font-semibold">
				Filter Accounts
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
				Filter Categories
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
	</div>
</details> -->
