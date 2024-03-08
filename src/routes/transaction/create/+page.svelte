<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { currencyInputProps, withLoading } from '$lib/components/utils';
	import { writable } from 'svelte/store';
	import type { PageData } from './$types';

	export let data: PageData;

	let loading = writable(false);
</script>

<svelte:head>
	<title>Create Transaction</title>
</svelte:head>

<a href="/transaction" class="btn btn-sm mt-4">
	<Feather name="arrow-left" />
	Back to Transactions
</a>

<form
	action="/transaction?/create"
	method="post"
	class="max-w-lg mx-auto w-full gap-4 flex flex-col"
	use:enhance={withLoading(loading)}
>
	<h1 class="my-4 text-2xl font-bold">Create New Transaction</h1>

	<label class="input-label text-sm">
		Account
		<select name="accountId" class="input">
			{#each data.accounts as account (account.id)}
				<option value={account.id}>{account.name}</option>
			{/each}
		</select>
	</label>

	<label class="input-label text-sm">
		Category
		<select name="categoryId" class="input">
			<option value={null}>To Be Assigned</option>
			{#each data.categories as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</label>

	<label class="input-label text-sm">
		Date
		<input
			type="date"
			name="date"
			class="input"
			value={new Date().toISOString().slice(0, 10)}
		/>
	</label>

	<label class="input-label text-sm">
		Description
		<input type="text" name="description" class="input" placeholder="" />
	</label>

	<label class="input-label text-sm">
		Flow
		<span class="text-muted text-xs">{currencyInputProps.information}</span>
		<input
			type="text"
			name="flow"
			class="input"
			title={currencyInputProps.title}
			pattern={currencyInputProps.pattern}
			inputmode="numeric"
			placeholder="0"
		/>
	</label>

	<div class="flex justify-between">
		<a href="/transaction" class="btn">Cancel</a>

		<Button
			type="submit"
			class="btn btn-green"
			icon="file-plus"
			loading={$loading}>Create</Button
		>
	</div>
</form>
