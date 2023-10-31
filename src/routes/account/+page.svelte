<script lang="ts">
	import { enhance } from '$app/forms';
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let loading = false;
</script>

<div
	class="flex flex-col gap-2 my-8 border-neutral focus-within:border-accent border-dashed transition-colors border p-4 rounded-md shadow"
>
	<h2 class="text-2xl font-semibold">Create New Account</h2>

	<form
		action="?/createAccount"
		method="post"
		class="flex flex-col gap-4 sm:flex-row items-end"
		use:enhance={() => {
			loading = true;

			return async ({ update }) => {
				loading = false;
				update();
			};
		}}
	>
		<div class="form-control w-full max-w-xs">
			<label class="label" for="accountName">
				<span class="label-text">Name</span>
			</label>
			<input
				type="text"
				id="accountName"
				name="accountName"
				placeholder="my beloved piggy bank"
				class="input input-bordered w-full"
				disabled={loading}
			/>
		</div>

		<div class="form-control w-full max-w-xs">
			<label class="label" for="accountDescription">
				<span class="label-text">Description</span>
			</label>
			<input
				type="text"
				id="accountDescription"
				name="accountDescription"
				placeholder="(optional)"
				class="input input-bordered w-full"
				disabled={loading}
			/>
		</div>

		<button type="submit" class="btn btn-outline btn-accent" disabled={loading}>
			{#if loading}
				<Feather name="loader" class="animate-spin" />
				just a moment
			{:else}
				<Feather name="plus-circle" />
				Create Account
			{/if}
		</button>
	</form>
</div>

<!-- <ul>
	{#each data.accounts as account (account.id)}
		<li>
			<a href="/account/{account.id}">{account.name}</a>
		</li>
	{/each}
</ul>

<form use:enhance method="post" action="?/createUserAccount">
	<div class="form-control w-full max-w-xs">
		<label class="label" for="accountName">
			<span class="label-text">Create a new account</span>
		</label>
		<input
			type="text"
			id="accountName"
			name="accountName"
			placeholder="Type here"
			class="input input-bordered w-full"
		/>
	</div>

	<button type="submit" class="btn btn-primary btn-sm">create account</button>
</form> -->
