<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import { currencyInputProps } from '$lib/components/utils';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<form
	method="post"
	use:enhance
	class="max-w-md w-full mx-auto my-4 flex flex-col gap-2"
>
	<h1 class="mb-4">Edit Transaction</h1>

	<label class="input-label">
		Account
		<select name="accountId" class="input" value={data.transaction.accountId}>
			{#each data.accounts as account (account.id)}
				<option value={account.id}>{account.name}</option>
			{/each}
		</select>
	</label>

	<label class="input-label">
		Category
		<select name="categoryId" class="input" value={data.transaction.categoryId}>
			<option value={null}>To Be Assigned</option>
			{#each data.categories as category (category.id)}
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
			{...currencyInputProps}
		/>
	</label>

	{#if form?.error}
		<p class="text-red-light mx-auto">{form.error}</p>
	{/if}

	<div class="flex justify-between mt-4">
		<a href="/transaction" class="btn btn-ghost">cancel</a>

		<Button icon="chevrons-up" class="btn btn-blue">Update</Button>
	</div>
</form>
