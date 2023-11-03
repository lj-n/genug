<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
</script>

<form
	method="post"
	class="max-w-sm w-full bg-neutral-50 m-auto flex flex-col items-center gap-4 p-4 border border-neutral-400 rounded shadow"
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

	<h1>Login</h1>

	<label class="input-label">
		Username
		<input type="text" name="username" id="username" class="input" />
	</label>

	<label class="input-label">
		Password
		<input type="password" name="password" id="password" class="input" />
	</label>

	{#if form?.error}
		<div class="flex mt-4">
			<p class="mx-auto text-red-600 my-4 text-center">
				{form.error}
			</p>
		</div>
	{/if}

	<Button icon="key" class="btn btn-primary mt-2" {loading}>Login</Button>

	<a href="/signup">Create New User</a>
</form>
