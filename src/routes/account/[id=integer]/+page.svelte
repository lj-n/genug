<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let data: PageData;
	export let form: ActionData;

	let updateLoading = false;
	let moveTransactionLoading = false;
	let removeAccountLoading = false;

	let moveTransactionInput = '';
	let removeAccountInput = '';

	$: moveTransactionReady = moveTransactionInput === data.account.details.name;
	$: removeAccountReady = removeAccountInput === data.account.details.name;
</script>

<div class="grid md:grid-cols-2 gap-4">
	<div
		class="p-4 border border-neutral-400 rounded-lg bg-neutral-50 flex flex-col gap-4"
	>
		<h1>{data.account.details.name}</h1>

		<p>Description: {data.account.details.description || '~'}</p>

		<div class="grid grid-cols-2 h-fit max-w-sm">
			<h2 class="col-span-2">Details</h2>

			<span>Related Transactions Count</span>
			<span class="font-semibold tabular-nums text-right">
				{data.account.transactions.count}
			</span>

			<span>Validated Transactions Sum</span>
			<span class="font-semibold tabular-nums text-right">
				{formatFractionToLocaleCurrency(data.account.transactions.validatedSum)}
			</span>

			<span>Pending Transactions Sum</span>
			<span class="font-semibold tabular-nums text-right">
				{formatFractionToLocaleCurrency(data.account.transactions.pendingSum)}
			</span>

			<span>Account Balance</span>
			<span class="font-semibold tabular-nums text-right">
				{formatFractionToLocaleCurrency(
					data.account.transactions.validatedSum +
						data.account.transactions.pendingSum
				)}
			</span>
		</div>
	</div>

	<form
		action="?/updateAccount"
		method="post"
		class="flex flex-col gap-4 p-4 border border-neutral-400 rounded-md bg-neutral-50"
		use:enhance={() => {
			updateLoading = true;
			return async ({ update }) => {
				updateLoading = false;
				update();
			};
		}}
	>
		<h2>Update Account</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				id="name"
				class="input"
				placeholder="Account Name"
				disabled={updateLoading}
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
				disabled={updateLoading}
			/>
		</label>

		{#if form?.updateAccountError}
			<p class="text-red-600 my-2">{form.updateAccountError}</p>
		{/if}

		<Button
			icon="arrow-up"
			class="btn btn-secondary ml-auto mt-2"
			loading={updateLoading}
		>
			Update Account Details
		</Button>
	</form>
</div>

<h2 class="mt-8 text-red-500">Danger Zone ⚡</h2>
<p class="mb-4 text-red-500 font-bold">
	Warning: These actions can not be undone!
</p>

<div class="grid md:grid-cols-2 gap-4 mb-8">
	<form
		action="?/moveTransactions"
		method="post"
		class="flex flex-col gap-4 p-4 border border-red-500 rounded-md bg-neutral-50"
		use:enhance={() => {
			moveTransactionLoading = true;
			return async ({ update }) => {
				moveTransactionLoading = false;
				update();
			};
		}}
	>
		<h3>Move Transactions to Another Account</h3>

		<label class="input-label">
			Select another Account
			<select name="newAccountId" class="input" required>
				<option selected disabled>Select Account Here</option>
				{#each data.otherAccounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<p id="warning-label">
			Please type <b>{data.account.details.name}</b> to confirm:
		</p>
		<input
			bind:value={moveTransactionInput}
			type="text"
			name="accountName"
			class="input w-full"
			aria-labelledby="warning-label"
			required
		/>

		<Button
			class="btn btn-danger ml-auto mt-2"
			icon="chevrons-right"
			loading={moveTransactionLoading}
			disabled={!moveTransactionReady}
		>
			Move Transactions
		</Button>
	</form>

	<form
		action="?/removeAccount"
		method="post"
		class="flex flex-col gap-4 p-4 border border-red-500 rounded-md bg-neutral-50"
		use:enhance={() => {
			removeAccountLoading = true;
			return async ({ update }) => {
				removeAccountLoading = false;
				update();
			};
		}}
	>
		<h3>
			Delete Account and its Transactions ({data.account.transactions.count})
		</h3>

		<p>
			Please type <b>{data.account.details.name}</b> to confirm:
		</p>
		<input
			bind:value={removeAccountInput}
			type="text"
			name="accountName"
			class="input w-full"
			aria-labelledby="warning-label"
		/>

		<Button
			class="btn btn-danger ml-auto mt-2"
			icon="trash"
			loading={removeAccountLoading}
			disabled={!removeAccountReady}
		>
			Delete Account
		</Button>
	</form>
</div>
