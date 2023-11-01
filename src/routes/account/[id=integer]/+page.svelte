<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import Button from '$lib/components/button.svelte';

	export let data: PageData;
	export let form: ActionData;

	let loadingNameUpdate = false;
</script>

<div
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
</div>
