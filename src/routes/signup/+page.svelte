<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Sign up</h1>

<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>

{#if form?.error}
	<p class="error">{form.error}</p>
{/if}

<a href="/password-reset">Reset password</a>
<a href="/signin">Sign In</a>
