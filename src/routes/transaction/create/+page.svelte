<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<pre>{JSON.stringify(data, null, 2)}</pre>

<form
	action="?/createUserTransaction"
	method="post"
	use:enhance
	class="flex flex-col gap-2"
>
	<div class="form-control w-full max-w-xs">
		<label class="label" for="accountId">
			<span class="label-text">Account</span>
		</label>
		<select
			class="select select-bordered select-sm"
			id="accountId"
			name="accountId"
		>
			<option disabled selected>Pick an account</option>
			{#each data.accounts as account (account.id)}
				<option value={account.id}>{account.name}</option>
			{/each}
		</select>
	</div>

	<div class="form-control w-full max-w-xs">
		<label class="label" for="categoryId">
			<span class="label-text">Category</span>
		</label>
		<select
			class="select select-bordered select-sm"
			id="categoryId"
			name="categoryId"
		>
			<option selected value={null}>(None) To Be Assigned</option>
			{#each data.categories as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</div>

	<div class="form-control w-full max-w-xs">
		<label class="label" for="description">
			<span class="label-text">Description</span>
		</label>
		<input
			type="text"
			placeholder="Description here"
			class="input input-sm input-bordered w-full"
			id="description"
			name="description"
		/>
	</div>

	<div class="form-control w-full max-w-xs">
		<label class="label" for="date">
			<span class="label-text">Date</span>
		</label>
		<input
			type="date"
			class="input input-sm input-bordered w-full"
			id="date"
			name="date"
		/>
	</div>

	<div class="form-control w-full max-w-xs">
		<label class="label" for="flow">
			<span class="label-text">Flow</span>
		</label>
		<input
			type="number"
			class="input input-sm input-bordered w-full"
			id="flow"
			name="flow"
		/>
	</div>

	<div class="form-control w-full max-w-xs">
		<label class="label cursor-pointer" for="validated">
			<span class="label-text">Validated</span>
			<input
				type="checkbox"
				checked={false}
				class="checkbox checkbox-sm"
				id="validated"
				name="validated"
			/>
		</label>
	</div>

	<button type="submit" class="btn btn-primary">create transaction</button>
</form>
