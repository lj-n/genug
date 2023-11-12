<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
</script>

<form
	method="post"
	class="max-w-sm w-full bg-bg-2 m-auto flex flex-col items-center gap-4 p-4 border border-ui rounded-lg focus-within:border-ui-3"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}}
>
	<div class="w-2/3">
		<img src="/logo.svg" alt="genug logo" class="w-full" />
	</div>

	<h1>Sign up!</h1>

	<label class="input-label">
		Username
		<input type="text" name="username" id="username" class="input" />
	</label>

	<label class="input-label group" for="password">
		<div class="flex justify-between items-end">
			Password
			<span
				class="text-xs opacity-0 group-focus-within:opacity-90 transition-opacity"
			>
				(minimum 8 characters)
			</span>
		</div>
		<input type="password" name="password" id="password" class="input" />
	</label>

	{#if form?.error}
		<div class="flex mt-4">
			<p class="mx-auto text-red-600 my-4 text-center">
				{form.error}
			</p>
		</div>
	{/if}

	<Button icon="user-plus" class="btn btn-green mt-2" {loading}>
		Create User
	</Button>

	<a href="/signin">Are you already registered?</a>
</form>
