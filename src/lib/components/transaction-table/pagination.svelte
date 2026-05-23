<script lang="ts">
	import * as Pagination from '$lib/components/ui/pagination';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';

	import { getTableContext } from './context.svelte';

	const tableContext = getTableContext();
	const { page, pageSize, totalTransactionCount: total } = $derived(tableContext.pagination());

	let pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
	let isFirstPage = $derived(page === 1);
	let isLastPage = $derived(page === pageCount);

	let pagesInfo: string = $derived.by(() => {
		const currentPage = Math.min(page, pageCount);
		const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
		const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);
		return m.transactions_pagination_showing({
			end: String(end),
			start: String(start),
			total: String(total)
		});
	});

	const PAGE_SIZES = ['15', '25', '50', '100'] as const;
</script>

<div class="flex items-center justify-between gap-4">
	<div class="flex items-center gap-2">
		<Select.Root
			type="single"
			bind:value={
				() => pageSize.toString(),
				async (newPageSize) => {
					tableContext.setPaginationParam('pageSize', newPageSize);
				}
			}
		>
			<Select.Trigger
				class="h-auto w-fit border-none bg-transparent px-2 py-1"
				aria-label={m.transactions_pagination_page_size_label()}
			>
				{m.transactions_pagination_per_page({ count: String(pageSize) })}
			</Select.Trigger>
			<Select.Content>
				{#each PAGE_SIZES as size (size)}
					<Select.Item value={size}>
						{m.transactions_pagination_per_page({ count: size })}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<div class="text-sm text-muted">
			{pagesInfo}
		</div>
	</div>

	<Pagination.Root
		class="ml-auto w-fit"
		count={total}
		perPage={pageSize}
		bind:page={
			() => page,
			async (newPage) => {
				tableContext.setPaginationParam('page', newPage.toString());
			}
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
