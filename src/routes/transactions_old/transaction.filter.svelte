<script lang="ts">
	import { page } from '$app/stores';
	import Feather from '$lib/components/feather.svelte';
	import { clickOutside } from '$lib/components/utils';

	export let data: { name: string; id: number }[];
	export let key: string;
	export let label: string;

	$: activeFilter = $page.url.searchParams.getAll(key);

	/**
	 * Creates a href that will "toggle" the filter value
	 * @para value - The value of the filter.
	 * @returns - The filter href.
	 */
	function createFilterHref(url: URL, value: string): string {
		const searchParams = new URLSearchParams(url.searchParams);

		if (searchParams.has(key, value)) {
			searchParams.delete(key, value);
		} else {
			searchParams.append(key, value);
		}

		return searchParams.toString();
	}

	/**
	 * Removes a filter value from the URL search parameters.
	 *
	 * @param url - The URL object representing the current URL.
	 * @returns - The filter href.
	 */
	function removeFilterHref(url: URL): string {
		const searchParams = new URLSearchParams(url.searchParams);

		if (searchParams.has(key)) {
			searchParams.delete(key);
		}

		return searchParams.toString();
	}

	/**
	 * Progressive enhance the detail to close on click outside
	 * or when a different filter detail element is openend
	 */
	function closeDetails(element: HTMLElement) {
		if (element.hasAttribute('open')) {
			element.removeAttribute('open');
		}
	}
</script>

<details
	class="relative hidden text-sm md:block"
	use:clickOutside={closeDetails}
>
	<summary
		class="hover:fg border-ui-normal flex cursor-pointer list-none items-center gap-2 rounded rounded border px-1 px-2 py-1"
	>
		<Feather name="filter" class="text-xs text-muted" />

		{label}

		{#if activeFilter.length > 0}
			({activeFilter.length})
		{/if}
	</summary>

	<div
		class="bg border-ui-normal absolute top-[125%] z-10 flex w-40 flex-col items-start rounded border p-1 shadow-sm"
	>
		{#each data as { name, id } (id)}
			{@const isActive = activeFilter.includes(id.toString())}
			<a
				data-sveltekit-keepfocus
				href="/transactions?{createFilterHref($page.url, id.toString())}"
				class="hover:fg flex w-full items-center gap-2 rounded p-1 text-xs"
			>
				<div class="flex-shrink-0 text-muted" class:text-blue={isActive}>
					<Feather name={isActive ? 'check-square' : 'square'} />
				</div>
				<span class="text-start">
					{name}
				</span>
			</a>
		{/each}

		{#if activeFilter.length > 0}
			<div class="border-ui-hover my-1 w-full border-t"></div>
			<a
				data-sveltekit-keepfocus
				href="/transactions?{removeFilterHref($page.url)}"
				class="hover:fg flex w-full items-center gap-2 rounded p-1 text-xs text-muted"
			>
				<div class="flex-shrink-0">
					<Feather name="trash" />
				</div>
				<span class="text-start"> Clear All </span>
			</a>
		{/if}
	</div>
</details>
