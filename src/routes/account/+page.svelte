<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { scale } from 'svelte/transition';
	import {
		formatFractionToLocaleCurrency,
		withLoading
	} from '$lib/components/utils';
	import { writable } from 'svelte/store';

	export let data: PageData;
	export let form: ActionData;

	let loading = writable(false);
</script>

<h1 class="my-8">Accounts</h1>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 mb-4">
	{#each data.accounts as account (account.id)}
		<div
			class="p-4 grid-cols-2 grid gap-4 border border-ui hover:border-ui-2 rounded-lg "
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
				<span class="text-lg font-bold tabular-nums">
					{formatFractionToLocaleCurrency(account.validated + account.pending)}
				</span>
			</div>
		</div>
	{/each}
</div>

<form
	method="post"
	class="p-4 flex flex-col gap-2 w-full max-w-sm mx-auto mb-4"
	use:enhance={withLoading(loading)}
>
	<h2 class="text-xl font-semibold">Create New Account</h2>

	<label class="input-label">
		Name
		<input
			type="text"
			name="name"
			id="name"
			class="input"
			value={form?.name || ''}
			required
		/>
	</label>

	<label class="input-label">
		Description (optional)
		<input
			type="text"
			name="description"
			id="description"
			class="input"
			value={form?.description || ''}
		/>
	</label>

	{#if form?.error}
		<p class="text-red-light">{form.error}</p>
	{/if}

	<Button
		icon="plus-circle"
		class="btn btn-green mx-auto mt-2"
		loading={$loading}
	>
		Create
	</Button>
</form>
