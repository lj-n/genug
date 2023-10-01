<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Email Verification</h1>

<form method="POST" use:enhance>
	{#if data.token}
		<input type="hidden" name="token" value={data.token} />
	{:else}
		<label for="token">Verification Token:</label>
		<input
			type="text"
			id="token"
			name="token"
			placeholder="Paste your token here"
			required
		/>
	{/if}

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<button type="submit">Verify</button>
</form>
