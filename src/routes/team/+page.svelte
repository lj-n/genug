<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Create New Team</h1>

<form use:enhance method="POST">
	<label for="name">Team Name</label>
	<input type="text" id="name" name="name" placeholder="Team Name" required />

	<label for="description">Description</label>
	<input id="description" name="description" placeholder="Description" />

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<button type="submit">Create Team</button>
</form>
