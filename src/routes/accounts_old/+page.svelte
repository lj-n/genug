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

<div class="flex flex-wrap gap-8 py-8">
	<div class="grow">
		<h1 class="text-2xl font-bold">Accounts</h1>
		<div class="mt-8 flex flex-col gap-1">
			{#each data.accounts as account (account.id)}
				<div
					animate:flip
					transition:scale
					class="border-ui-normal bg hover:border-ui-hover dark:(border-ui-normal-dark hover:border-ui-hover-dark) flex flex-col rounded-xl border p-2"
				>
					<span class="text-lg font-semibold">{account.name}</span>
					<span class="text-sm text-muted">{account.description || ''}</span>

					<div class="mt-4 flex items-end">
						<div class="flex flex-col">
							<span class="font-semibold tabular-nums leading-4">
								{formatFractionToLocaleCurrency(account.working)}
							</span>
							<span class="text-xs text-muted">Balance</span>
						</div>
						<a
							href="/accounts/{account.id}"
							class="btn btn-sm hover:text-normal ml-auto text-xs text-muted"
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
		action="?/create"
		method="post"
		class="mx-auto flex w-full max-w-sm flex-col gap-4"
		use:enhance={withLoading(loading)}
	>
		<h2 class="mb-4 text-lg font-semibold">Create Account</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				class="input"
				value={form?.data?.name ?? ''}
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
				value={form?.data?.description ?? ''}
				placeholder="Account at Bank xyz"
			/>
		</label>

		<p class="mt-6 text-sm text-muted">
			Do you want this account to be a team account?
		</p>

		<label class="input-label text-sm">
			Team
			<select name="teamId" class="input text-xs">
				<option value={null}>No Team</option>
				{#each data.teams as { team } (team.id)}
					<option value={team.id}>{team.name}</option>
				{/each}
			</select>
		</label>

		{#if form?.error}
			<p class="mx-auto my-2 text-red">{form.error}</p>
		{/if}

		<Button icon="plus-circle" class="btn btn-green ml-auto" loading={$loading}>
			Create
		</Button>
	</form>
</div>
