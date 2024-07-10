<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import { currencyInputProps } from '$lib/components/utils';
	import type { getBudget } from '$lib/server/budgets';
	import { writable } from 'svelte/store';

	export let budget: ReturnType<typeof getBudget>[number];

	let loading = writable(false);
</script>

<div
	id="target-budget-input-{budget.id}"
	class="group pointer-events-none opacity-0 fixed inset-0 flex bg-base-black/20 dark:bg-base-white/10 z-40 transition-opacity target:(opacity-100 pointer-events-auto)"
>
	<form
		method="post"
		class="m-auto bg p-4 rounded-xl flex flex-col gap-4 shadow-lg -translate-y-2 transition-transform group-target:translate-y-0"
		use:enhance={() => {
			loading.set(true);
			return async ({ update }) => {
				/** Close this update modal by removing its id from the url hash */
				window.location.hash = '#';
				update();
				loading.set(false);
			};
		}}
	>
		<!-- svelte-ignore a11y-invalid-attribute -->
		<a href="#" class="ml-auto" title="Close Budget Form">
			<Feather name="x" />
		</a>

		<div class="flex flex-col">
			<span class="muted">Category:</span>
			<h2 class="font-semibold text-lg">{budget.name}</h2>
		</div>

		<input type="hidden" name="categoryId" value={budget.id} />

		<label class="input-label">
			<span> New Budget </span>
			<input
				type="text"
				name="budget"
				class="input"
				value={budget.budget}
				title={currencyInputProps.title}
				pattern={currencyInputProps.pattern}
			/>
		</label>

		<Button
			type="submit"
			class="btn btn-blue ml-auto"
			icon="tag"
			loading={$loading}
		>
			Set Budget
		</Button>
	</form>
</div>
