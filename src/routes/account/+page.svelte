<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import type { ActionData, PageData } from './$types';
	import { scale } from 'svelte/transition';
	import {
		formatFractionToLocaleCurrency,
		withLoading
	} from '$lib/components/utils';
	import { writable } from 'svelte/store';

	export let data: PageData;
	export let form: ActionData;

	const loading = writable(false);
</script>

<svelte:head>
	<title>Accounts</title>
</svelte:head>

<div class="flex flex-wrap py-8 gap-8">
	<div class="grow">
		<h1 class="font-bold text-2xl">Accounts</h1>
		<div class="flex flex-col gap-1 mt-8">
			{#each data.accounts as account (account.id)}
				<div
					animate:flip
					transition:scale
					class="p-2 flex flex-col border-ui-normal border rounded-xl bg hover:border-ui-hover dark:(border-ui-normal-dark hover:border-ui-hover-dark)"
				>
					<span class="font-semibold text-lg">{account.name}</span>
					<span class="text-muted text-sm">{account.description || ''}</span>

					<div class="flex items-end mt-4">
						<div class="flex flex-col">
							<span class="font-semibold tabular-nums leading-4">
								{formatFractionToLocaleCurrency(
									account.validated + account.pending
								)}
							</span>
							<span class="text-muted text-xs">Balance</span>
						</div>
						<a
							href="/account/{account.id}"
							class="btn btn-sm ml-auto text-xs text-muted hover:text-normal"
						>
							<Feather name="corner-right-up" />
							Details
						</a>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<form
		method="post"
		class="mx-auto flex flex-col gap-4 w-full max-w-sm"
		use:enhance={withLoading(loading)}
	>
		<h2 class="font-semibold text-lg mb-4">Create Account</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				class="input"
				value={form?.name || ''}
				required
				placeholder="Savings Account"
			/>
		</label>

		<label class="input-label">
			Description (optional)
			<input
				type="text"
				name="description"
				class="input"
				value={form?.description || ''}
				placeholder="Account at Bank xyz"
			/>
		</label>

		{#if form?.error}
			<p class="text-red my-2 mx-auto">{form.error}</p>
		{/if}

		<Button icon="plus-circle" class="btn btn-green ml-auto" loading={$loading}>
			Create
		</Button>
	</form>
</div>
