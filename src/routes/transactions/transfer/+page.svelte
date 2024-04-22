<script lang="ts">
	import { enhance } from '$app/forms';
	import Feather from '$lib/components/feather.svelte';
	import { currencyInputProps } from '$lib/components/utils';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Transactions | Transfer</title>
</svelte:head>

<a href="/transactions" class="btn btn-sm mt-4">
	<Feather name="arrow-left" />
	Back to Transactions
</a>

<form method="post" use:enhance class="flex flex-col gap-4">
	<h1 class="my-4 text-2xl font-bold flex items-center gap-4 mx-auto">
		<Feather name="shuffle" />
		Transfer Transactions
	</h1>
	<p class="text-center text-muted mx-auto">
		Transfer money from one account to another. This will create one outgoing
		and one incoming transaction.
	</p>

	<div class="flex gap-4 flex-wrap justify-center">
		<div
			class="flex flex-col gap-2 max-w-md w-full rounded-xl border border-ui focus-within:border-blue p-4"
		>
			<span class="text-lg font-bold flex gap-2">
				<Feather name="upload" />
				Transfer From
			</span>

			<label class="input-label text-sm">
				Account
				<select name="fromAccountId" class="input">
					{#each data.accounts as account (account.id)}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</label>

			<label class="input-label text-sm">
				Category
				<select name="fromCategoryId" class="input">
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
					name="fromDate"
					class="input"
					value={new Date().toISOString().slice(0, 10)}
				/>
			</label>
		</div>

		<div
			class="flex flex-col gap-2 max-w-md w-full rounded-xl border border-ui focus-within:border-orange p-4"
		>
			<span class="text-lg font-bold flex gap-2">
				<Feather name="download" />
				Transfer To
			</span>

			<label class="input-label text-sm">
				Account
				<select name="toAccountId" class="input">
					{#each data.accounts as account (account.id)}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</label>

			<label class="input-label text-sm">
				Category
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
					name="toDate"
					class="input"
					value={new Date().toISOString().slice(0, 10)}
				/>
			</label>
		</div>
	</div>
	<label class="input-label">
		Transfer Amount
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

	<button type="submit" class="btn btn-blue"> Submit </button>
</form>
