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

<div class="mx-auto mt-8 w-fit text-xs text-muted">
	<span> Created at {formattedDate} </span>
	{#if data.account.team}
		<span class="px-2 text-blue"> by Team {data.account.team.name} </span>
	{/if}
</div>
<h1 class="mx-auto text-3xl font-bold">{data.account.name}</h1>
<span class="mx-auto mb-8 text-xl text-muted">
	{data.account.description || ''}
</span>

<div
	class="mb-12 ml-auto mt-8 flex flex-col items-end gap-2 md:mx-auto md:flex-row md:gap-4"
>
	<div class="flex w-fit flex-col items-end">
		<span class="text-4xl font-semibold tabular-nums">
			{formatFractionToLocaleCurrency(data.account.validated)}
		</span>
		<span class="leading-tight text-muted">Validated Balance</span>
	</div>

	<span class="mb-auto hidden text-4xl font-bold text-muted md:block">+</span>

	<div class="mb-4 flex w-fit flex-col items-end md:mb-0">
		<span
			class="text-4xl font-semibold tabular-nums"
			class:text-green-light={data.account.pending > 0}
			class:text-red-light={data.account.pending < 0}
		>
			{formatFractionToLocaleCurrency(data.account.pending)}
		</span>
		<span class="leading-tight text-muted">Pending Balance</span>
	</div>

	<span class="mb-auto hidden text-4xl font-bold text-muted md:block">=</span>

	<div
		class="border-ui-normal dark:border-ui-normal-dark flex w-fit flex-col items-end border-t-2 md:border-none"
	>
		<span class="text-4xl font-bold tabular-nums">
			{formatFractionToLocaleCurrency(data.account.working)}
		</span>
		<span class="leading-tight text-muted">Working Balance</span>
	</div>
</div>

<div class="mx-auto flex w-full max-w-xl flex-col gap-4 py-8 md:gap-12">
	<form
		action="?/updateAccount"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(updateLoading)}
	>
		<h2 class="text-lg font-semibold">Update Account Details</h2>

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
			<p class="text-error my-2 text-center">{form.updateAccountError}</p>
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
		<h2 class="text-lg font-semibold">Move Transactions to Another Account</h2>
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
			<p class="text-error my-2 text-center">{form.moveTransactionError}</p>
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
		<h2 class="text-lg font-semibold">
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
			<p class="text-error my-2 text-center">{form.removeAccountError}</p>
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
