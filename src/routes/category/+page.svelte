<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let loading = false;
</script>

<h1>Categories</h1>

<div class="category-list">
	{#each data.categories as category (category.id) }
		<div class="flex">
			<div class="">

			</div>
			<span>{category.name}</span>
			<span>{category.description}</span>
		</div>
	{/each}
</div>

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
	<h1>Create Category</h1>

	<label class="input-label">
		Name
		<input type="text" name="name" class="input" disabled={loading} required placeholder="Groceries"/>
	</label>

	<label class="input-label">
		Description (optional)
		<input type="text" name="description" class="input" disabled={loading} placeholder="food, household products, etc."/>
	</label>

	{#if form?.error}
		<p class="text-red my-2 mx-auto">{form.error}</p>
	{/if}

	<Button icon="folder-plus" class="btn btn-green ml-auto" {loading}>Create</Button>
</form>

<style>
	.category-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-base);
	}
	.category-list__element {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border-radius: var(--radius-default);
		border: 1px solid var(--ui-normal-color);
	}
</style>