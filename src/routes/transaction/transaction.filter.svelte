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

<details class="relative text-sm" use:clickOutside={closeDetails}>
	<summary
		class="list-none cursor-pointer hover:fg px-1 rounded flex items-center gap-2 px-2 py-1 rounded border border-ui-normal"
	>
		<Feather name="filter" class="text-muted text-xs" />

		{label}

		{#if activeFilter.length > 0}
			({activeFilter.length})
		{/if}
	</summary>

	<div
		class="absolute top-[125%] bg w-40 rounded border border-ui-normal flex flex-col p-1 items-start shadow-sm z-10"
	>
		{#each data as { name, id } (id)}
			{@const isActive = activeFilter.includes(id.toString())}
			<a
				data-sveltekit-keepfocus
				href="/transaction?{createFilterHref($page.url, id.toString())}"
				class="rounded hover:fg p-1 gap-2 text-xs w-full flex items-center"
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
			<div class="border-t border-ui-hover w-full my-1"></div>
			<a
				data-sveltekit-keepfocus
				href="/transaction?{removeFilterHref($page.url)}"
				class="rounded hover:fg p-1 gap-2 text-xs w-full flex items-center text-muted"
			>
				<div class="flex-shrink-0">
					<Feather name="trash" />
				</div>
				<span class="text-start"> Clear All </span>
			</a>
		{/if}
	</div>
</details>
