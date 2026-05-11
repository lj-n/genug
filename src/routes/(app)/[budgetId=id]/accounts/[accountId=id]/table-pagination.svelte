<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page as pageState } from '$app/state';
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';

	import type { PaginationState } from './types';

	let { page, pageSize, pageTotalCount }: PaginationState = $props();

	async function setPaginationQueryParam(
		param: 'page' | 'pageSize',
		value: string,
		updateState: () => void
	) {
		const { searchParams } = pageState.url;
		searchParams.set(param, value);

		await goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${searchParams.toString()}`, {
				accountId: pageState.params.accountId!,
				budgetId: pageState.params.budgetId!
			}),
			{
				invalidateAll: true,
				noScroll: true
			}
		);

		updateState();
	}

	let pageCount = $derived(Math.max(1, Math.ceil(pageTotalCount / pageSize)));
	let isFirstPage = $derived(page === 1);
	let isLastPage = $derived(page === pageCount);

	let pagesInfo: string = $derived.by(() => {
		const currentPage = Math.min(page, pageCount);
		const start = pageTotalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
		const end = pageTotalCount === 0 ? 0 : Math.min(start + pageSize - 1, pageTotalCount);
		return m.transactions_pagination_showing({
			end: String(end),
			start: String(start),
			total: String(pageTotalCount)
		});
	});
</script>

<div class="flex items-center justify-between gap-4">
	<div class="flex items-center gap-2">
		<Select.Root
			type="single"
			bind:value={
				() => pageSize.toString(),
				async (newPageSize) =>
					setPaginationQueryParam('pageSize', newPageSize, () => {
						pageSize = Number(newPageSize);
					})
			}
		>
			<Select.Trigger
				class="h-auto w-fit border-none bg-transparent px-2 py-1"
				aria-label={m.transactions_pagination_page_size_label()}
			>
				{m.transactions_pagination_per_page({ count: String(pageSize) })}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="15">{m.transactions_pagination_per_page({ count: '15' })}</Select.Item>
				<Select.Item value="25">{m.transactions_pagination_per_page({ count: '25' })}</Select.Item>
				<Select.Item value="50">{m.transactions_pagination_per_page({ count: '50' })}</Select.Item>
				<Select.Item value="75">{m.transactions_pagination_per_page({ count: '75' })}</Select.Item>
				<Select.Item value="100">{m.transactions_pagination_per_page({ count: '100' })}</Select.Item
				>
			</Select.Content>
		</Select.Root>

		<div class="text-sm text-muted">
			{pagesInfo}
		</div>
	</div>

	<Pagination.Root
		class="ml-auto w-fit"
		count={pageTotalCount}
		perPage={pageSize}
		bind:page={
			() => page,
			async (newPage) =>
				setPaginationQueryParam('page', String(newPage), () => {
					page = newPage;
				})
		}
	>
		{#snippet children({ currentPage, pages })}
			<Pagination.Content>
				<Pagination.Item>
					<Pagination.PrevButton disabled={isFirstPage} aria-disabled={isFirstPage} />
				</Pagination.Item>

				{#each pages as page (page.key)}
					{#if page.type === 'ellipsis'}
						<Pagination.Item>
							<Pagination.Ellipsis />
						</Pagination.Item>
					{:else}
						<Pagination.Item>
							<Pagination.Link {page} isActive={currentPage === page.value}>
								{page.value}
							</Pagination.Link>
						</Pagination.Item>
					{/if}
				{/each}

				<Pagination.Item>
					<Pagination.NextButton disabled={isLastPage} aria-disabled={isLastPage} />
				</Pagination.Item>
			</Pagination.Content>
		{/snippet}
	</Pagination.Root>
</div>
