<script context="module" lang="ts">
	/**
	 * Creates a href that will "toggle" the filter value
	 * @para value - The value of the filter.
	 * @returns - The filter href.
	 */
	function createFilterHref(url: URL, key: string, value: string): string {
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
	function removeFilterHref(url: URL, key: string): string {
		const searchParams = new URLSearchParams(url.searchParams);

		if (searchParams.has(key)) {
			searchParams.delete(key);
		}

		return searchParams.toString();
	}
</script>

<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';

	import LucideCircleDashed from '~icons/lucide/circle-dashed';
	import LucideCircleDot from '~icons/lucide/circle-dot';
	import LucideCircleOff from '~icons/lucide/circle-off';
	import LucideFilter from '~icons/lucide/filter';

	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	export let data: { id: number | string; name: string }[];
	export let searchParamName: string;
	export let label: string;

	$: activeFilter = $page.url.searchParams.getAll(searchParamName);
</script>

<DropdownMenu.Root closeOnItemClick={false}>
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="icon"
			class="aspect-square w-fit"
		>
			<LucideFilter
				class={cn(
					activeFilter.length > 0 ? 'text-primary' : 'text-secondary-foreground'
				)}
			/>
			{#if activeFilter.length > 0}
				<span class="text-primary">
					({activeFilter.length})
				</span>
			{/if}
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Label>
			{#if activeFilter.length > 0}
				Selected {activeFilter.length} {label}
			{:else}
				Select {label} to Filter
			{/if}
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<ScrollArea class="h-64">
			<DropdownMenu.Group>
				{#each data as { id, name } (id)}
					{@const isActive = activeFilter.includes(id.toString())}
					<DropdownMenu.Item
						href="/transactions?{createFilterHref(
							$page.url,
							searchParamName,
							id.toString()
						)}"
						class="flex items-center gap-2"
					>
						{#if isActive}
							<LucideCircleDot class="text-xs text-primary" />
						{:else}
							<LucideCircleDashed class="text-xs text-secondary-foreground" />
						{/if}
						{name}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</ScrollArea>
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			href="/transactions?{removeFilterHref($page.url, searchParamName)}"
			class="flex items-center gap-2"
		>
			<LucideCircleOff class="text-xs text-secondary-foreground" />
			Clear All
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
