<script lang="ts">
	import type { ActionData } from './$types';
	import { writable } from 'svelte/store';
	import { enhance } from '$app/forms';
	import { withLoading } from '$lib/components/utils';
	import Button from '$lib/components/button.svelte';

	export let form: ActionData;

	let loading = writable(false);
</script>

<svelte:head>
	<title>Create User</title>
</svelte:head>

<form
	method="post"
	use:enhance={withLoading(loading)}
	class="m-auto w-full max-w-sm flex flex-col gap-4"
>
	<div class="w-2/3 mx-auto mb-8">
		<img src="/logo.svg" alt="genug logo" />
	</div>

	<label class="input-label">
		Username
		<input type="text" name="username" id="username" class="input" />
	</label>

	<label class="input-label">
		Password
		<input type="password" name="password" id="password" class="input" />
	</label>

	{#if form?.error}
		<p class="text-error mx-auto text-center">
			{form.error}
		</p>
	{/if}

	<Button icon="user-plus" class="btn btn-green w-full" loading={$loading}>
		Create User
	</Button>

	<a href="/signin" class="link mx-auto">Already registered?</a>
</form>
