<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import { currencyInputProps, withLoading } from '$lib/components/utils';
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';

	export let data: PageData;

	let loading = writable(false);

	/**
	 * Progressive enhance: Make only categories selectable
	 * that match the selected account's team/user
	 */
	let selectedFromAccountId = data.accounts[0]?.id;
	$: selectedFromAccount = data.accounts.find(
		(account) => account.id === selectedFromAccountId
	);
	$: availableFromCategories = data.categories.filter((category) => {
		if (selectedFromAccount?.team) {
			return category.team?.id === selectedFromAccount.team.id;
		} else {
			return category.team === null;
		}
	});
	let selectedToAccountId = data.accounts[0]?.id;
	$: selectedToAccount = data.accounts.find(
		(account) => account.id === selectedToAccountId
	);
	$: availableToCategories = data.categories.filter((category) => {
		if (selectedToAccount?.team) {
			return category.team?.id === selectedToAccount.team.id;
		} else {
			return category.team === null;
		}
	});
</script>

<svelte:head>
	<title>Transaction | Transfer</title>
</svelte:head>

<a href="/transactions" class="btn btn-sm mt-4">
	<Feather name="arrow-left" />
	Back to Transactions
</a>

<h1 class="font-bold text-2xl mx-auto my-4">Transfer Money</h1>

<form
	method="post"
	class="flex flex-wrap justify-center gap-8"
	use:enhance={withLoading(loading)}
>
	<div
		class="flex flex-col gap-4 grow max-w-lg min-w-sm rounded-lg p-4 focus-within:fg transition-colors bg"
	>
		<span class="font-bold text-xl flex items-center gap-4">
			<Feather name="share" />
			From
		</span>
		<label class="input-label text-sm">
			Account
			<select
				name="fromAccount"
				class="input"
				bind:value={selectedFromAccountId}
			>
				{#each data.accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			Category
			<select name="fromCategory" class="input">
				<option value={null}>To Be Assigned</option>
				{#each availableFromCategories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			Date
			<input
				type="date"
				name="fromDate"
				class="input"
				value={new Date().toISOString().slice(0, 10)}
			/>
		</label>
	</div>

	<div
		class="flex flex-col gap-4 grow max-w-lg min-w-sm rounded-lg p-4 focus-within:fg transition-colors bg"
	>
		<span class="font-bold text-xl flex items-center gap-4">
			<Feather name="download" />
			To
		</span>
		<label class="input-label text-sm">
			Account
			<select name="toAccount" class="input" bind:value={selectedToAccountId}>
				{#each data.accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			Category
			<select name="toCategory" class="input">
				<option value={null}>To Be Assigned</option>
				{#each availableToCategories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label text-sm">
			Date
			<input
				type="date"
				name="toDate"
				class="input"
				value={new Date().toISOString().slice(0, 10)}
			/>
		</label>
	</div>

	<div
		class="flex flex-col gap-4 grow max-w-lg min-w-sm rounded-lg p-4 focus-within:fg transition-colors bg"
	>
		<span class="font-bold text-xl flex items-center gap-4">
			<Feather name="hash" />
			Amount
		</span>

		<label class="input-label">
			Transfer Amount
			<span class="text-muted text-xs">{currencyInputProps.information}</span>
			<input
				type="text"
				name="amount"
				class="input"
				title={currencyInputProps.title}
				pattern={currencyInputProps.pattern}
				inputmode="numeric"
				placeholder="0"
			/>
		</label>

		<Button
			type="submit"
			class="btn btn-green w-full"
			icon="plus"
			loading={$loading}
		>
			Create Transactions
		</Button>
	</div>
</form>
