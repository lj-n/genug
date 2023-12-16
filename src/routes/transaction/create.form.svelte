<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { currencyInputProps, withLoading } from '$lib/components/utils';
	import type {
		SelectUserAccount,
		SelectUserCategory
	} from '$lib/server/schema/tables';
	import { writable } from 'svelte/store';

	export let accounts: SelectUserAccount[];
	export let categories: SelectUserCategory[];

	let loading = writable(false);
</script>

<form
	action="?/create"
	method="post"
	class="grid md:grid-cols-3 grid-cols-1 mt-4 p-6 rounded-xl gap-4 border border-ui-normal dark:(border-ui-normal-dark)"
	use:enhance={withLoading(loading)}
>
	<h2 class="font-semibold md:col-span-3">Create Transactions</h2>

	<label class="input-label text-sm">
		Account
		<select name="accountId" class="input text-sm">
			{#each accounts as account (account.id)}
				<option value={account.id}>{account.name}</option>
			{/each}
		</select>
	</label>

	<label class="input-label text-sm">
		Category
		<select name="categoryId" class="input text-sm">
			<option value={null}>To Be Assigned</option>
			{#each categories as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</label>

	<label class="input-label text-sm">
		Date
		<input
			type="date"
			name="date"
			class="input text-sm"
			value={new Date().toISOString().slice(0, 10)}
		/>
	</label>

	<label class="input-label text-sm">
		Description
		<input type="text" name="description" class="input text-sm" placeholder=""/>
	</label>

	<label class="input-label text-sm">
		Flow
		<input
			type="text"
			name="flow"
			class="input text-sm"
			title={currencyInputProps.title}
			pattern={currencyInputProps.pattern}
			placeholder="0"
		/>
	</label>

	<Button type="submit" class="btn w-full text-sm btn-green mt-auto ml-auto" icon="file-plus">
		Create
	</Button>
</form>

<!-- <details class="group my-8 max-w-md w-full">
	<summary
		class="select-none cursor-pointer btn btn-ghost group-open:btn-sm px-2"
	>
		<span class="group-open:hidden inline-flex items-center gap-2">
			<Feather name="file-plus" />
			Create Transaction
		</span>
		<span class="hidden group-open:block">close</span>
	</summary>

	<form
		action="?/create"
		method="post"
		class="flex flex-col gap-2 mt-4 p-4 border border-ui focus-within:border-green-light rounded-lg"
		use:enhance
	>
		<label class="input-label">
			Account
			<select name="accountId" class="input">
				{#each accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label">
			Category
			<select name="categoryId" class="input">
				<option value={null}>To Be Assigned</option>
				{#each categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label">
			Date
			<input
				type="date"
				name="date"
				class="input"
				value={new Date().toISOString().slice(0, 10)}
			/>
		</label>

		<label class="input-label">
			Description
			<input type="text" name="description" class="input" />
		</label>

		<label class="input-label">
			Flow
			<input
				type="text"
				name="flow"
				class="input"
				title={currencyInputProps.title}
				pattern={currencyInputProps.pattern}
			/>
		</label>

		<Button type="submit" class="btn btn-green mt-2" icon="file-plus">
			Create
		</Button>
	</form>
</details> -->
