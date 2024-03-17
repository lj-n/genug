<script lang="ts">
	import { enhance } from '$app/forms';
	import Feather from '$lib/components/feather.svelte';
	import type { getCategories } from '$lib/server/categories';

	export let index: number | null = null;
	export let currentOrder: number[] = [];
	export let category: ReturnType<typeof getCategories>[number];

	/** move an element in an array */
	function arraymove<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
		const arrCopy = [...arr];
		var element = arrCopy[fromIndex];
		arrCopy.splice(fromIndex, 1);
		arrCopy.splice(toIndex, 0, element);
		return arrCopy;
	}

	/** category order if we move this category up */
	$: moveNextIndex =
		index !== null && index > 0
			? arraymove(currentOrder, index, index - 1)
			: currentOrder;

	/** category order if we move this category down */
	$: movePrevIndex =
		index !== null && index < currentOrder.length - 1
			? arraymove(currentOrder, index, index + 1)
			: currentOrder;
</script>

<div
	class="group p-2 flex flex-col gap-1 border-ui-normal border rounded-xl bg hover:border-ui-hover dark:(border-ui-normal-dark hover:border-ui-hover-dark)"
>
	<div>
		<span>{category.name}</span>
		{#if category.team}
			<span class="text-muted">
				(Team: {category.team.name})
			</span>
		{/if}
	</div>
	<span class="text-muted text-sm">{category.description || ''}</span>

	<div class="flex">
		{#if index !== null}
			<form
				action="?/saveOrder"
				method="post"
				use:enhance
				class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
			>
				<input type="hidden" name="categoryId" value={category.id} />
				{#if index > 0}
					<button
						type="submit"
						name="order"
						value={JSON.stringify(moveNextIndex)}
						class="btn btn-sm text-xs"
					>
						<Feather name="chevron-up" />
					</button>
				{/if}

				{#if index < currentOrder.length - 1}
					<button
						type="submit"
						name="order"
						value={JSON.stringify(movePrevIndex)}
						class="btn btn-sm text-xs"
					>
						<Feather name="chevron-down" />
					</button>
				{/if}
			</form>
		{/if}
		<a
			href="/categories/{category.id}"
			class="btn btn-sm ml-auto text-xs text-muted hover:text-normal"
		>
			<Feather name="corner-right-up" />
			Details
		</a>
	</div>
</div>
