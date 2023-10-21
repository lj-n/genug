<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<pre>{JSON.stringify(data, null, 2)}</pre>

<ul>
	{#each data.categories as category (category.id)}
		<li>
			<a href="/category/{category.id}">{category.name}</a>
		</li>
	{/each}
</ul>

<form use:enhance method="post" action="?/createUserCategory">
	<div class="form-control w-full max-w-xs">
		<label class="label" for="categoryName">
			<span class="label-text">Create a new category</span>
		</label>
		<input
			type="text"
			id="categoryName"
			name="categoryName"
			placeholder="Type here"
			class="input input-bordered w-full"
		/>
	</div>

	<button type="submit" class="btn btn-primary btn-sm">create category</button>
</form>
