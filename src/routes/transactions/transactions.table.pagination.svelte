<script lang="ts">
	import { page } from '$app/stores';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { PaginationState } from 'svelte-headless-table/plugins';
	import type { PageData } from './$types';

	import LucideChevronLeft from '~icons/lucide/chevron-left';
	import LucideChevronRight from '~icons/lucide/chevron-right';
	import { goto } from '$app/navigation';

	export let data: PageData;
	export let paginationState: PaginationState;

	$: count = data.totalTransactionCount;
	$: currentPage = data.filter.page;

	const { hasNextPage, hasPreviousPage, pageIndex, pageSize } = paginationState;

	$: {
		$pageIndex = data.filter.page;
		$pageSize = data.filter.limit;
	}

	$: getPrevPageHref = () => {
		const searchParams = new URLSearchParams($page.url.searchParams);
		if ($hasPreviousPage) {
			searchParams.set('page', (currentPage - 1).toString());
		}
		return '/transactions?' + searchParams.toString();
	};

	$: getNextPageHref = () => {
		const searchParams = new URLSearchParams($page.url.searchParams);
		if ($hasNextPage) {
			searchParams.set('page', (currentPage + 1).toString());
		}
		return '/transactions?' + searchParams.toString();
	};

	$: getPageHref = (page: number) => {
		const searchParams = new URLSearchParams($page.url.searchParams);
		searchParams.set('page', page.toString());
		return '/transactions?' + searchParams.toString();
	};

	$: getLimitHref = (limit: number) => {
		const searchParams = new URLSearchParams($page.url.searchParams);
		searchParams.set('limit', limit.toString());
		return '/transactions?' + searchParams.toString();
	};
</script>

<div class="ml-auto mt-4 flex items-center gap-4">
	<span class="whitespace-nowrap text-xs text-muted-foreground">
		{$pageIndex * $pageSize - $pageSize}-{$pageIndex * $pageSize}
		of
		{count}
		Transactions
	</span>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" size="sm">
				{data.filter.limit} Per Page
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-16">
			<DropdownMenu.Group>
				<DropdownMenu.Item on:click={() => goto(getLimitHref(15))}>
					15 Per Page
				</DropdownMenu.Item>
				<DropdownMenu.Item on:click={() => goto(getLimitHref(25))}>
					25 Per Page
				</DropdownMenu.Item>
				<DropdownMenu.Item on:click={() => goto(getLimitHref(50))}>
					50 Per Page
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Pagination.Root
		{count}
		perPage={$pageSize}
		page={$pageIndex}
		let:pages
		let:currentPage
		class="items-end"
	>
		<Pagination.Content>
			<Pagination.Item>
				<a
					href={getPrevPageHref()}
					class={buttonVariants({ variant: 'ghost', size: 'icon' })}
					data-sveltekit-keepfocus
				>
					<LucideChevronLeft />
					<span class="sr-only">Previous</span>
				</a>
			</Pagination.Item>
			{#each pages as page (page.key)}
				{@const isActive = currentPage === page.value}
				{#if page.type === 'ellipsis'}
					<Pagination.Item>
						<Pagination.Ellipsis />
					</Pagination.Item>
				{:else}
					<Pagination.Item>
						<a
							href={getPageHref(page.value)}
							class={buttonVariants({
								variant: isActive ? 'outline' : 'ghost',
								size: 'icon'
							})}
							data-sveltekit-keepfocus
						>
							{page.value}
						</a>

						<!-- <Pagination.Link {page} isActive={currentPage === page.value}>
						{page.value}
					</Pagination.Link> -->
					</Pagination.Item>
				{/if}
			{/each}
			<Pagination.Item>
				<a
					href={getNextPageHref()}
					class={buttonVariants({ variant: 'ghost', size: 'icon' })}
					data-sveltekit-keepfocus
				>
					<LucideChevronRight />
					<span class="sr-only">Next</span>
				</a>
			</Pagination.Item>
		</Pagination.Content>
	</Pagination.Root>
</div>
