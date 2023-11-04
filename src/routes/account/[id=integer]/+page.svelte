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

<div
	class="flex flex-col bg-neutral-50 p-4 rounded border border-neutral-400 shadow"
>
	<h1>{data.account.details.name}</h1>

	<p class="my-4">{data.account.details.description || '~'}</p>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="grid grid-cols-2 h-fit">
			<h2 class="col-span-2">Details</h2>

			<span>Transactions</span>
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

		<form
			action="?/updateAccount"
			method="post"
			class="flex flex-col gap-4"
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
</div>

<div
	class="p-4 border border-red-500 rounded my-8 shadow bg-neutral-50 grid grid-cols-1 sm:grid-cols-2 gap-4"
>
	<div class="sm:col-span-2">
		<h2 class="text-red-500">Danger Zone ⚡</h2>
		<p class="text-red-500">Warning: These actions can not be undone!</p>
	</div>

	<form
		action="?/moveTransactions"
		method="post"
		class="flex flex-col gap-2"
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
		class="flex flex-col gap-2"
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

<!-- <div
	class="flex flex-col gap-12 flex-grow bg-base-200 rounded-xl py-8 px-4 -mx-4"
>
	<h1 class="text-4xl font-bold">{data.account.name}</h1>

	<form
		action="?/changeName"
		method="post"
		class="flex gap-4 items-end"
		use:enhance={() => {
			loadingNameUpdate = true;
			return async ({ update }) => {
				loadingNameUpdate = false;
				update();
			};
		}}
	>
		<div class="form-control w-full max-w-sm">
			<label class="label" for="accountName">
				<span class="label-text">Account Name</span>
			</label>
			<input
				type="text"
				id="accountName"
				name="accountName"
				placeholder={data.account.name}
				class="input input-sm input-bordered w-full"
				disabled={loadingNameUpdate}
			/>
		</div>

		<Button
			class="btn btn-sm btn-ghost btn-outline"
			loading={loadingNameUpdate}
		>
			Update Name
		</Button>
	</form>

	{#if form?.errorNameUpdate}
		<span class="my-2 text-error">{form.errorNameUpdate}</span>
	{/if}

	<div class="flex gap-8 py-2 px-6 rounded-xl border border-secondary w-fit">
		<div class="flex flex-col items-end">
			<span>Validated</span>
			<span class="text-lg font-bold tabular-nums">
				{formatFractionToLocaleCurrency(data.balance.validated)}
			</span>
		</div>

		<div class="flex flex-col items-end">
			<span>Pending</span>
			<span class="text-lg font-bold tabular-nums">
				{formatFractionToLocaleCurrency(data.balance.pending)}
			</span>
		</div>

		<div class="flex flex-col items-end">
			<span>Working</span>
			<span class="text-lg font-bold tabular-nums">
				{formatFractionToLocaleCurrency(
					data.balance.validated + data.balance.pending
				)}
			</span>
		</div>
	</div>

	<div class="w-full flex flex-col gap-2 max-w-md">
		<h2 class="text-2xl font-bold mb-4 text-accent">Last Transactions</h2>

		{#each data.account.transactions as transaction (transaction.id)}
			<div
				class="flex justify-between py-2 last:border-b-0 border-b border-neutral"
			>
				<div class="flex flex-col">
					<span class="text-lg font-semibold">
						{transaction.category?.name || 'To Be Assigned'}
					</span>
					<span class="text-neutral-content">
						{transaction.description || '~'}
					</span>
				</div>

				<div class="flex flex-col items-end">
					<span class="text-neutral-content">{transaction.date}</span>
					<span class="text-lg font-bold">
						{formatFractionToLocaleCurrency(transaction.flow)}
					</span>
				</div>
			</div>
		{/each}

		<a href="/transaction" class="link link-hover mx-auto">show all</a>
	</div>
</div> -->
