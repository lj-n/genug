<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { currencyInputProps } from '$lib/components/utils';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	/**
	 * Progressive enhancement: Make only categories selectable
	 * that match the selected account's team/user
	 */
	let selectedAccountId = data.transaction.account?.id;
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
	<title>Transaction | Edit</title>
</svelte:head>

<a href="/transactions" class="btn btn-sm mt-4">
	<Feather name="arrow-left" />
	Back to Transactions
</a>

<form
	action="?/edit"
	method="post"
	use:enhance
	class="border-ui-normal mx-auto my-4 flex w-full max-w-md flex-col gap-2 rounded-xl border p-4"
>
	<h1 class="mx-auto my-4 flex items-center gap-4 text-2xl font-bold">
		<Feather name="edit" />
		Edit Transaction
	</h1>

	<label class="input-label">
		Account
		<select name="accountId" class="input" bind:value={selectedAccountId}>
			{#each data.accounts as account (account.id)}
				<option value={account.id}>{account.name}</option>
			{/each}
		</select>
	</label>

	<label class="input-label">
		Category
		<select
			name="categoryId"
			class="input"
			value={data.transaction.category?.id}
		>
			<option value={null}>To Be Assigned</option>
			{#each availableCategories as category (category.id)}
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
			value={data.transaction.date}
		/>
	</label>

	<label class="input-label">
		Description
		<input
			type="text"
			name="description"
			class="input"
			value={data.transaction.description || ''}
		/>
	</label>

	<label class="input-label">
		Flow
		<input
			type="text"
			name="flow"
			class="input"
			value={data.transaction.flow}
			title={currencyInputProps.title}
			pattern={currencyInputProps.pattern}
		/>
	</label>

	{#if form?.error}
		<p class="text-error mx-auto">{form.error}</p>
	{/if}

	<div class="mt-4 flex justify-between">
		<a href="/transactions" class="btn btn-ghost">cancel</a>

		<Button icon="chevrons-up" class="btn btn-blue">Edit</Button>
	</div>
</form>
