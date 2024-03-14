<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
</script>

<form
	action="?/create"
	method="post"
	use:enhance
	class="flex flex-col gap-2 mx-auto w-full max-w-md"
>
	<h1 class="font-bold text-2xl mx-auto">Create New Team</h1>

	<label class="input-label">
		Name
		<input type="text" name="name" id="name" class="input" />
	</label>

	<label class="input-label">
		Description
		<input type="text" name="description" id="description" class="input" />
	</label>

	<Button type="submit" icon="users" class="btn btn-green w-full">
		Create
	</Button>
</form>
