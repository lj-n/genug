<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import {
		formatFractionToLocaleCurrency,
		withLoading
	} from '$lib/components/utils';
	import { writable } from 'svelte/store';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: ({ account } = data);

	const updateLoading = writable(false);
	const moveTransactionLoading = writable(false);
	const removeAccountLoading = writable(false);

	let moveTransactionInput = '';
	let removeAccountInput = '';

	$: moveTransactionReady = moveTransactionInput === account.details.name;
	$: removeAccountReady = removeAccountInput === account.details.name;
</script>

<a href="/account" class="btn btn-ghost btn-sm w-fit mt-4">
	<Feather name="corner-up-left" />
	Go Back
</a>

<h1 class="mt-8 mb-2 border-b border-ui">{account.details.name}</h1>
<span class="text-tx-2 text-sm">Created At: {account.details.createdAt}</span>
<span class="text-tx-2">{account.details.description || ''}</span>

<div
	class="flex flex-col md:flex-row gap-2 md:gap-4 items-end ml-auto md:mx-auto mt-8 mb-12"
>
	<div class="flex flex-col items-end w-fit">
		<span class="tabular-nums font-semibold text-4xl">
			{formatFractionToLocaleCurrency(account.transactions.validatedSum)}
		</span>
		<span class="leading-tight text-tx-2">Validated Balance</span>
	</div>

	<span class="text-tx-2 mb-auto text-4xl font-bold hidden md:block">+</span>

	<div class="flex flex-col items-end w-fit mb-4 md:mb-0">
		<span
			class="tabular-nums font-semibold text-4xl"
			class:text-green-light={account.transactions.pendingSum > 0}
			class:text-red-light={account.transactions.pendingSum < 0}
		>
			{formatFractionToLocaleCurrency(account.transactions.pendingSum)}
		</span>
		<span class="leading-tight text-tx-2">Pending Balance</span>
	</div>

	<span class="text-tx-2 mb-auto text-4xl font-bold hidden md:block">=</span>

	<div
		class="flex flex-col items-end w-fit border-t-2 border-tx-2 md:border-none"
	>
		<span class="tabular-nums font-bold text-4xl">
			{formatFractionToLocaleCurrency(
				account.transactions.validatedSum + account.transactions.pendingSum
			)}
		</span>
		<span class="leading-tight text-tx-2">Working Balance</span>
	</div>
</div>

<div class="flex flex-col gap-4 md:gap-8 max-w-xl w-full mx-auto">
	<form
		action="?/updateAccount"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(updateLoading)}
	>
		<h2>Update Account Details</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				id="name"
				class="input"
				placeholder="Account Name"
			/>
		</label>

		<label class="input-label">
			Description
			<input
				type="text"
				name="description"
				id="description"
				class="input"
				placeholder="What is this account for?"
			/>
		</label>

		{#if form?.updateAccountError}
			<p class="text-red-600 my-2">{form.updateAccountError}</p>
		{/if}

		<Button
			icon="arrow-up"
			class="btn btn-blue ml-auto mt-2"
			loading={$updateLoading}
		>
			Update
		</Button>
	</form>

	<form
		action="?/moveTransactions"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(moveTransactionLoading)}
	>
		<h2 class="text-red-light">Move Transactions to Another Account</h2>
		<blockquote class="danger">
			Careful! This action cannot be undone.
		</blockquote>

		<label class="input-label">
			Select another Account
			<select name="newAccountId" class="input" required>
				<option selected disabled>Select Account Here</option>
				{#each data.otherAccounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<div>
			<label for="move-transactions">
				Type <b>{data.account.details.name}</b> to confirm.
			</label>

			<input
				bind:value={moveTransactionInput}
				type="text"
				name="accountName"
				id="move-transactions"
				class="input w-full"
				placeholder="Type name of account"
				required
			/>
		</div>

		{#if form?.moveTransactionError}
			<p class="text-red-light my-2">{form.moveTransactionError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto mt-2"
			icon="chevrons-right"
			loading={$moveTransactionLoading}
		>
			Move Transactions
		</Button>
	</form>

	<form
		action="?/removeAccount"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(removeAccountLoading)}
	>
		<h2 class="text-red-light">
			Delete Account and its Transactions ({data.account.transactions.count})
		</h2>
		<blockquote class="danger">
			Careful! This action cannot be undone.
		</blockquote>

		<div>
			<label for="remove-transactions">
				Type <b>{data.account.details.name}</b> to confirm.
			</label>

			<input
				bind:value={moveTransactionInput}
				type="text"
				name="accountName"
				id="remove-transactions"
				class="input w-full"
				placeholder="Type name of account"
				required
			/>
		</div>

		{#if form?.removeAccountError}
			<p class="text-red-light my-2">{form.removeAccountError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto mt-2"
			icon="trash"
			loading={$removeAccountLoading}
		>
			Delete Account
		</Button>
	</form>
</div>
