<script lang="ts">
	import { enhance } from "$app/forms";
	import Button from "$lib/components/button.svelte";
	import Feather from "$lib/components/feather.svelte";
	import { currencyInputProps } from "$lib/components/utils";
	import type { SelectUserAccount, SelectUserCategory } from "$lib/server/schema/tables";

  export let accounts: SelectUserAccount[]
  export let categories: SelectUserCategory[]

</script>

<details class="group my-8 max-w-md w-full">
	<summary class="select-none cursor-pointer btn btn-ghost group-open:btn-sm px-2">
		<span class="group-open:hidden inline-flex items-center gap-2">
			<Feather name="file-plus" />
			Create Transaction
		</span>
		<span class="hidden group-open:block">close</span>
	</summary>

	<form
		action="?/create"
		method="post"
		class="flex flex-col gap-2 mt-4 p-4 border border-ui focus-within:border-green-light rounded-lg"
    use:enhance
	>
		<label class="input-label">
			Account
			<select name="accountId" class="input">
				{#each accounts as account (account.id)}
					<option value={account.id}>{account.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label">
			Category
			<select name="categoryId" class="input">
				<option value={null}>To Be Assigned</option>
				{#each categories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label">
			Date
			<input type="date" name="date" class="input" value={new Date().toISOString().slice(0, 10)} />
		</label>

		<label class="input-label">
			Description
			<input type="text" name="description" class="input" />
		</label>

		<label class="input-label">
			Flow
			<input type="text" name="flow" class="input" {...currencyInputProps} />
		</label>

		<Button type="submit" class="btn btn-green mt-2" icon="file-plus">
			Create
		</Button>
	</form>
</details>