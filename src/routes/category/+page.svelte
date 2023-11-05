<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
</script>

<form
	method="post"
	class="mx-auto md:col-span-3 flex flex-col gap-4 w-full max-w-sm"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	}}
>
	<h1>Create New Category</h1>

	<label class="input-label">
		Name
		<input type="text" name="name" class="input" disabled={loading} required />
	</label>

	<label class="input-label">
		Description (optional)
		<input type="text" name="description" class="input" disabled={loading} />
	</label>

	{#if form?.error}
		<p class="text-red-500 my-2 mx-auto">{form.error}</p>
	{/if}

	<Button icon="folder-plus" class="btn btn-primary" {loading}>Create</Button>
</form>
