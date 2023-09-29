<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Sign in</h1>

<form method="post" use:enhance>
	<label for="email">Email</label>
	<input name="email" id="email" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<button type="submit">signin</button>
</form>

{#if form?.error}
	<p class="error">{form.error}</p>
{/if}

<a href="/password-reset">Forgot password</a>
<a href="/signup">Create an account</a>
