<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';
	import { scale } from 'svelte/transition';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let data: PageData;

	let loading = false;
</script>

<main class="flex flex-col gap-8">
	<h1 class="text-5xl font-bold">Your Accounts</h1>

	<div class="overflow-x-auto border border-secondary shadow-xl rounded-xl p-2">
		<table class="table">
			<thead>
				<tr>
					<th>Name</th>
					<th>Description</th>
					<th>Created at</th>
					<th>Balance Validated</th>
					<th>Balance Pending</th>
					<th>Balance Working</th>
					<th />
				</tr>
			</thead>

			<tbody>
				{#each data.accounts as account (account.id)}
					<tr class="text-xl" animate:flip transition:scale>
						<td>{account.name}</td>
						<td><span class="text-sm">{account.description || '-'}</span></td>
						<td><span class="text-sm">{account.createdAt}</span> </td>
						<td>
							<span class="tabular-nums font-bold">
								{formatFractionToLocaleCurrency(account.validated)}
							</span>
						</td>
						<td>
							<span class="tabular-nums font-bold">
								{formatFractionToLocaleCurrency(account.pending)}
							</span>
						</td>
						<td>
							<span class="tabular-nums font-bold">
								{formatFractionToLocaleCurrency(
									account.validated - account.pending
								)}
							</span>
						</td>
						<td>
							<a href="/account/{account.id}" class="btn btn-xs btn-ghost">
								<Feather name="edit" />
								edit
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<form
		class="flex flex-wrap gap-4 items-end border border-dashed shadow-xl border-neutral rounded-xl p-4"
		action="?/createAccount"
		method="post"
		use:enhance={() => {
			loading = true;

			return async ({ update }) => {
				loading = false;
				update();
			};
		}}
	>
		<h2 class="text-2xl font-semibold w-full">Create New Account</h2>

		<div class="form-control w-full max-w-sm">
			<label class="label" for="accountName">
				<span class="label-text">Account Name</span>
			</label>
			<input
				type="text"
				id="accountName"
				name="accountName"
				placeholder="my beloved piggy bank"
				class="input input-bordered w-full focus:input-accent"
				disabled={loading}
			/>
		</div>

		<div class="form-control w-full max-w-sm">
			<label class="label" for="accountDescription">
				<span class="label-text">Account Description</span>
			</label>
			<input
				type="text"
				id="accountDescription"
				name="accountDescription"
				placeholder="(optional)"
				class="input input-bordered w-full focus:input-accent"
				disabled={loading}
			/>
		</div>

		<Button
			type="submit"
			icon="plus-circle"
			class="btn btn-outline btn-accent ml-auto mt-6"
			{loading}
		>
			Create Account
		</Button>
	</form>
</main>
