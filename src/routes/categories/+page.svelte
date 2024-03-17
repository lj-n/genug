<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import type { ActionData, PageData } from './$types';
	import { scale } from 'svelte/transition';
	import { withLoading } from '$lib/components/utils';
	import { writable } from 'svelte/store';

	import CategoryCard from './category.card.svelte';

	export let data: PageData;
	export let form: ActionData;

	const loading = writable(false);

	$: activeCategories = data.categories.filter((category) => !category.retired);
	$: retiredCategories = data.categories.filter((category) => category.retired);
</script>

<svelte:head>
	<title>Categories</title>
</svelte:head>

<div class="flex flex-wrap py-8 gap-8">
	<div class="grow">
		<h1 class="font-bold text-2xl">Categories</h1>
		<div class="flex flex-col gap-1 mt-8">
			{#each activeCategories as category, i (category.id)}
				<div animate:flip={{ duration: 150 }} transition:scale>
					<CategoryCard
						index={i}
						currentOrder={activeCategories.map((c) => c.id)}
						{category}
					/>
				</div>
			{/each}

			{#if retiredCategories.length}
				<details class="group mt-8">
					<summary
						class="list-none flex gap-2 cursor-pointer select-none items-center"
					>
						<Feather
							name="chevron-down"
							class="hidden group-open:block text-lg text-orange"
						/>
						<Feather
							name="chevron-right"
							class="block group-open:hidden text-lg"
						/>
						<h2 class="font-semibold text-muted text-lg">Retired Categories</h2>
					</summary>

					<div class="flex flex-col gap-1 mt-4">
						{#each retiredCategories as category (category.id)}
							<div animate:flip={{ duration: 150 }} transition:scale>
								<CategoryCard {category} />
							</div>
						{/each}
					</div>
				</details>
			{/if}
		</div>
	</div>

	<form
		method="post"
		action="?/create"
		class="mx-auto flex flex-col gap-4 w-full max-w-sm"
		use:enhance={withLoading(loading)}
	>
		<h2 class="font-semibold text-lg mb-4">Create Category</h2>

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

		<p class="mt-6 text-muted text-sm">
			Do you want this category to be a team category?
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
			<p class="text-red my-2 mx-auto">{form.error}</p>
		{/if}

		<Button icon="folder-plus" class="btn btn-green ml-auto" loading={$loading}>
			Create
		</Button>
	</form>
</div>
