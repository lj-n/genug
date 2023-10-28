<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<form method="post" use:enhance class="flex flex-col gap-4 items-center">
	<h1>Sign in</h1>

	<div class="form-control w-full max-w-sm">
		<label class="label" for="username">
			<span class="label-text">Username</span>
		</label>
		<input
			type="text"
			name="username"
			id="username"
			placeholder="Your username"
			class="input input-bordered w-full"
		/>
	</div>

	<div class="form-control w-full max-w-sm">
		<label class="label" for="password">
			<span class="label-text">Password</span>
		</label>
		<input
			type="text"
			name="password"
			id="password"
			placeholder="****"
			class="input input-bordered w-full"
		/>
	</div>

	<button type="submit" class="btn btn-primary btn-wide">signin</button>

	<div class="flex flex-wrap gap-4">
		<a href="/signup" class="link link-hover link-accent">Create an account</a>
	</div>
</form>

{#if form?.error}
	<p class="error">{form.error}</p>
{/if}
