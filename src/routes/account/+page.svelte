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

<h1>Accounts</h1>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
	{#each data.accounts as account (account.id)}
		<div
			class="p-4 grid-cols-2 grid gap-4 border border-neutral-300 rounded shadow-sm bg-neutral-50"
			animate:flip
			transition:scale
		>
			<div class="flex flex-col">
				<span class="text-xs text-neutral-500">Name</span>
				<span class="text-lg font-semibold">{account.name}</span>
			</div>

			<a
				href="/account/{account.id}"
				aria-label=""
				class="ml-auto mb-auto inline-flex items-center gap-1 text-sm"
			>
				<Feather name="arrow-up-right" />
				Details
			</a>

			<div class="flex flex-col">
				<span class="text-xs text-neutral-500">Description</span>
				<span>{account.description || '~'}</span>
			</div>

			<div class="flex flex-col items-end">
				<span class="text-xs text-neutral-500">Balance</span>
				<span class="text-lg font-bold">
					{formatFractionToLocaleCurrency(account.validated + account.pending)}
				</span>
			</div>
		</div>
	{/each}
</div>

<form
	method="post"
	class="p-4 flex flex-col gap-2 w-full max-w-sm mx-auto"
	use:enhance={() => {
		loading = true;

		return async ({ update }) => {
			loading = false;
			update();
		};
	}}
>
	<h2 class="text-xl font-semibold">Create New Account</h2>

	<label class="input-label">
		Name
		<input
			type="text"
			name="name"
			id="name"
			class="input"
			required
			disabled={loading}
		/>
	</label>

	<label class="input-label">
		Description (optional)
		<input
			type="text"
			name="description"
			id="description"
			class="input"
			disabled={loading}
		/>
	</label>

	<Button icon="plus-circle" class="btn btn-primary mx-auto mt-2" {loading}>
		Create
	</Button>
</form>
