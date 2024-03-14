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

	const formattedDate = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(new Date(data.account.createdAt));

	const updateLoading = writable(false);
	const moveTransactionLoading = writable(false);
	const removeAccountLoading = writable(false);

	let moveTransactionInput = '';
	let removeAccountInput = '';
</script>

<svelte:head>
	<title>Account | {data.account.name}</title>
</svelte:head>

<a href="/accounts" class="btn btn-sm mt-4">
	<Feather name="arrow-left" />
	Back to Accounts
</a>

<span class="mt-8 text-muted text-xs w-fit mx-auto">
	Created at {formattedDate}
</span>
<h1 class="font-bold text-3xl mx-auto">{data.account.name}</h1>
<span class="text-xl text-muted mb-8 mx-auto">
	{data.account.description || ''}
</span>

<div
	class="flex flex-col md:flex-row gap-2 md:gap-4 items-end ml-auto md:mx-auto mt-8 mb-12"
>
	<div class="flex flex-col items-end w-fit">
		<span class="tabular-nums font-semibold text-4xl">
			{formatFractionToLocaleCurrency(data.account.validated)}
		</span>
		<span class="leading-tight text-muted">Validated Balance</span>
	</div>

	<span class="text-muted mb-auto text-4xl font-bold hidden md:block">+</span>

	<div class="flex flex-col items-end w-fit mb-4 md:mb-0">
		<span
			class="tabular-nums font-semibold text-4xl"
			class:text-green-light={data.account.pending > 0}
			class:text-red-light={data.account.pending < 0}
		>
			{formatFractionToLocaleCurrency(data.account.pending)}
		</span>
		<span class="leading-tight text-muted">Pending Balance</span>
	</div>

	<span class="text-muted mb-auto text-4xl font-bold hidden md:block">=</span>

	<div
		class="flex flex-col items-end w-fit border-t-2 border-ui-normal dark:border-ui-normal-dark md:border-none"
	>
		<span class="tabular-nums font-bold text-4xl">
			{formatFractionToLocaleCurrency(data.account.working)}
		</span>
		<span class="leading-tight text-muted">Working Balance</span>
	</div>
</div>

<div class="flex flex-col gap-4 md:gap-12 max-w-xl w-full mx-auto py-8">
	<form
		action="?/updateAccount"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(updateLoading)}
	>
		<h2 class="font-semibold text-lg">Update Account Details</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				id="name"
				class="input"
				placeholder="Account Name"
				value={form?.data?.name || data.account.name}
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
				value={form?.data?.description || data.account.description}
			/>
		</label>

		{#if form?.updateAccountError}
			<p class="text-error text-center my-2">{form.updateAccountError}</p>
		{/if}

		<Button
			icon="arrow-up"
			class="btn btn-blue ml-auto mt-2"
			loading={$updateLoading}
		>
			Update
		</Button>
	</form>

	<!-- <form
		action="?/moveTransactions"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(moveTransactionLoading)}
	>
		<h2 class="font-semibold text-lg">Move Transactions to Another Account</h2>
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
				Type <b>{data.account.name}</b> to confirm.
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
			<p class="text-error text-center my-2">{form.moveTransactionError}</p>
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
		<h2 class="font-semibold text-lg">
			Delete Account and its Transactions ({data.account.count})
		</h2>
		<blockquote class="danger">
			Careful! This action cannot be undone.
		</blockquote>

		<div>
			<label for="remove-transactions">
				Type <b>{data.account.name}</b> to confirm.
			</label>

			<input
				bind:value={removeAccountInput}
				type="text"
				name="accountName"
				id="remove-transactions"
				class="input w-full"
				placeholder="Type name of account"
				required
			/>
		</div>

		{#if form?.removeAccountError}
			<p class="text-error text-center my-2">{form.removeAccountError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto mt-2"
			icon="trash"
			loading={$removeAccountLoading}
		>
			Delete Account
		</Button>
	</form> -->
</div>
