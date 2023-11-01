<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
</script>

<div class="items-center gap-12 p-2 flex flex-col">
	<div class="w-full max-w-sm mt-8">
		<img src="/logo.svg" alt="genug logo" class="w-full" />
	</div>

	<form
		method="post"
		class="bg-gradient-to-tr from-base-200 to-base-100 p-6 sm:p-12 rounded-lg w-full max-w-md border border-neutral shadow-lg"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}}
	>
		<h2 class="font-bold text-3xl mb-8">
			<span
				class="bg-clip-text text-transparent bg-gradient-to-tr from-primary to-accent"
			>
				Sign
			</span>
			up!
		</h2>

		<div class="form-control w-full">
			<label class="label" for="username">
				<span class="label-text">Username</span>
			</label>
			<input
				type="text"
				name="username"
				id="username"
				placeholder="Your username"
				class="input input-bordered w-full"
				disabled={loading}
			/>
		</div>

		<div class="form-control w-full max-w-sm group">
			<label class="label" for="password">
				<span class="label-text">Password</span>
				<span
					class="label-text text-xs text-warning opacity-0 group-focus-within:opacity-90 transition-opacity"
				>
					(minimum 8 characters)
				</span>
			</label>
			<input
				type="password"
				name="password"
				id="password"
				placeholder="********"
				class="input input-bordered w-full"
				disabled={loading}
			/>
		</div>

		{#if form?.error}
			<div class="flex mt-4">
				<p class="mx-auto text-error my-4 text-center">
					{form.error}
				</p>
			</div>
		{/if}

		<div class="flex mt-8">
			<Button
				type="submit"
				class="btn btn-secondary mx-auto btn-wide font-bold"
				icon="chevrons-right"
			>
				Create User
			</Button>
		</div>
	</form>

	<a href="/signin" class="link link-hover">Already have an Account?</a>
</div>
