<script lang="ts">
	import type { ActionData } from './$types';
	import { writable } from 'svelte/store';
	import { enhance } from '$app/forms';
	import { withLoading } from '$lib/components/utils';
	import Button from '$lib/components/button.svelte';

	export let form: ActionData;

	let loading = writable(false);
</script>

<form method="post" use:enhance={withLoading(loading)}>
	<div class="logo">
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
		<p class="error">
			{form.error}
		</p>
	{/if}

	<Button icon="key" class="btn btn-blue mx" loading={$loading}>Login</Button>

	<a href="/signup" class="mx">Create New User</a>
</form>

<style>
	form {
		width: 100%;
		max-width: 20rem;
		margin: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-base);
	}

	.logo {
		width: 66%;
		margin: 0 auto;
	}
	.logo > img {
		width: 100%;
	}
</style>
