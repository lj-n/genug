<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import type { ActionData, PageData } from './$types';
	import { scale } from 'svelte/transition';
	import { withLoading } from '$lib/components/utils';
	import { writable } from 'svelte/store';

	export let data: PageData;
	export let form: ActionData;

	const loading = writable(false);
</script>

<div class="flex flex-wrap py-8 gap-8">
	<div class="order-2 grow rounded-xl max-w-2xl min-w-sm mx-auto">
		<h1 class="font-semibold text-xl">Categories</h1>
		<div class="flex flex-col gap-2">
			{#each data.categories as category (category.id)}
				<div
					animate:flip
					transition:scale
					class="first:pt-8 last:border-none py-4 flex flex-col border-ui-normal border-b bg hover:border-ui-hover"
				>
					<span>{category.name}</span>
					<span class="text-muted text-sm">{category.description || ''}</span>
					<a
						href="/category/{category.id}"
						class="btn btn-sm ml-auto text-xs text-muted hover:text-normal"
					>
						<Feather name="corner-right-up" />
						Details
					</a>
				</div>
			{/each}
		</div>
	</div>

	<form
		method="post"
		class="mx-auto flex flex-col gap-4 w-full max-w-sm"
		use:enhance={withLoading(loading)}
	>
		<h2 class="font-semibold text-xl mb-4">Create Category</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				class="input"
				required
				placeholder="Groceries"
			/>
		</label>

		<label class="input-label">
			Description (optional)
			<input
				type="text"
				name="description"
				class="input"
				placeholder="food, household products, etc."
			/>
		</label>

		{#if form?.error}
			<p class="text-red my-2 mx-auto">{form.error}</p>
		{/if}

		<Button icon="folder-plus" class="btn btn-green ml-auto" loading={$loading}>
			Create
		</Button>
	</form>
</div>
