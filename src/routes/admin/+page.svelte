<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import { withLoading } from '$lib/components/utils';
	import { writable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const loading = writable(false);
</script>

<div class="flex flex-col gap-2">
	<h1 class="text-2xl font-bold mt-4 mb-2">Admin Page</h1>
	<p class="mb-4 text-muted">
		This page is only accessible to users with the admin role.
	</p>

	{#if form?.error}
		<p class="my-4 text-error">{form.error}</p>
	{/if}

	{#if form?.success}
		<p class="my-4 text-green">User updated successfully!</p>
	{/if}

	{#each data.users as user (user.id)}
		<form
			method="post"
			class="flex flex-col max-w-sm rounded-xl fg shadow-sm border border-ui-normal p-2"
			use:enhance={withLoading(loading)}
		>
			<h2 class="text-semibold">Username: {user.name}</h2>
			<p class="text-sm text-muted">ID: {user.id}</p>

			<div class="flex gap-2 items-end mt-4">
				<input type="hidden" name="userId" value={user.id} />

				<label class="input-label text-xs">
					Set New Password
					<input
						class="input text-sm"
						type="text"
						name="password"
						id="password"
					/>
				</label>

				<Button
					class="btn btn-orange text-sm"
					icon="save"
					type="submit"
					loading={$loading}
				>
					Save
				</Button>
			</div>
		</form>
	{/each}
</div>
