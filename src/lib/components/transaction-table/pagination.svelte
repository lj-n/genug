<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as PaginationPrimitive from '$lib/components/ui/pagination';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import type { PaginationState } from './types';

	let {
		pagination
	}: {
		pagination: PaginationState;
	} = $props();

	const { page: currentPage, pageSize, totalTransactionCount: total } = $derived(pagination);

	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const isFirstPage = $derived(currentPage === 1);
	const isLastPage = $derived(currentPage === pageCount);

	const pagesInfo: string = $derived.by(() => {
		const p = Math.min(currentPage, pageCount);
		const start = total === 0 ? 0 : (p - 1) * pageSize + 1;
		const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);
		return m.transactions_pagination_showing({
			end: String(end),
			start: String(start),
			total: String(total)
		});
	});

	const PAGE_SIZES = ['15', '25', '50', '100'] as const;

	function navigate(searchParams: URLSearchParams) {
		return goto(
			resolve(
				`/(app)/[budgetId=id]/accounts/[accountId=id]?${searchParams.toString()}`,
				{
					accountId: page.params.accountId!,
					budgetId: page.params.budgetId!
				}
			),
			{ keepFocus: true, noScroll: true }
		);
	}

	function setPageSize(newSize: string) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.set('pageSize', newSize);
		searchParams.delete('page');
		navigate(searchParams);
	}

	function setPage(newPage: number) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.set('page', String(newPage));
		navigate(searchParams);
	}
</script>

<div class="flex items-center justify-between gap-4">
	<div class="flex items-center gap-2">
		<Select.Root type="single" bind:value={() => pageSize.toString(), (v) => setPageSize(v)}>
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

	<PaginationPrimitive.Root
		class="ml-auto w-fit"
		count={total}
		perPage={pageSize}
		bind:page={() => currentPage, (v) => setPage(v)}
	>
		{#snippet children({ currentPage: cp, pages })}
			<PaginationPrimitive.Content>
				<PaginationPrimitive.Item>
					<PaginationPrimitive.PrevButton disabled={isFirstPage} aria-disabled={isFirstPage} />
				</PaginationPrimitive.Item>

				{#each pages as p (p.key)}
					{#if p.type === 'ellipsis'}
						<PaginationPrimitive.Item>
							<PaginationPrimitive.Ellipsis />
						</PaginationPrimitive.Item>
					{:else}
						<PaginationPrimitive.Item>
							<PaginationPrimitive.Link page={p} isActive={cp === p.value}>
								{p.value}
							</PaginationPrimitive.Link>
						</PaginationPrimitive.Item>
					{/if}
				{/each}

				<PaginationPrimitive.Item>
					<PaginationPrimitive.NextButton disabled={isLastPage} aria-disabled={isLastPage} />
				</PaginationPrimitive.Item>
			</PaginationPrimitive.Content>
		{/snippet}
	</PaginationPrimitive.Root>
</div>
