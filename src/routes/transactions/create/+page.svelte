<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { currencyInputProps, withLoading } from '$lib/components/utils';
	import { writable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let loading = writable(false);

	/**
	 * Progressive enhance: Make only categories selectable
	 * that match the selected account's team/user
	 */
	let selectedAccountId = data.accounts[0]?.id;
	$: selectedAccount = data.accounts.find(
		(account) => account.id === selectedAccountId
	);
	$: availableCategories = data.categories.filter((category) => {
		if (selectedAccount?.team) {
			return category.team?.id === selectedAccount.team.id;
		} else {
			return category.team === null;
		}
	});
</script>

<svelte:head>
	<title>Create Transaction</title>
</svelte:head>

<a href="/transactions" class="btn btn-sm mt-4">
	<Feather name="arrow-left" />
	Back to Transactions
</a>

<div class="flex flex-col gap-8">
	<form
		action="?/create"
		method="post"
		class="max-w-md w-full mx-auto flex flex-col gap-2 rounded-xl border border-ui-normal p-4"
		use:enhance={withLoading(loading)}
	>
		<h1 class="my-4 text-2xl font-bold flex items-center gap-4 mx-auto">
			<Feather name="file-plus" />
			Create New Transaction
		</h1>

		<label class="input-label text-sm">
			Account
			<select name="accountId" class="input" bind:value={selectedAccountId}>
				{#each data.accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			Category
			<select name="categoryId" class="input">
				<option value={null}>To Be Assigned</option>
				{#each availableCategories as category (category.id)}
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

		{#if form?.error}
			<p class="text-red-500 mx-auto">{form.error}</p>
		{/if}

		<div class="flex justify-between">
			<a href="/transactions" class="btn">Cancel</a>

			<Button
				type="submit"
				class="btn btn-green"
				icon="plus"
				loading={$loading}
			>
				Create
			</Button>
		</div>
	</form>

	<form
		action="?/transfer"
		method="post"
		use:enhance
		class="max-w-md w-full mx-auto flex flex-col gap-2 rounded-xl border border-ui-normal p-4"
	>
		<h1 class="my-4 text-2xl font-bold flex items-center gap-4 mx-auto">
			<Feather name="fast-forward" />
			Transfer Money
		</h1>
		<p class="text-center text-muted">
			Transfer money from one account to another.
		</p>

		<label class="input-label text-sm">
			From Account
			<select name="fromAccountId" class="input">
				{#each data.accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			From Category
			<select name="fromCategoryId" class="input">
				<option value={null}>To Be Assigned</option>
				{#each data.categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			To Account
			<select name="toAccountId" class="input">
				{#each data.accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			To Category
			<select name="toCategoryId" class="input">
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

		<button type="submit"> Submit </button>
	</form>
</div>
