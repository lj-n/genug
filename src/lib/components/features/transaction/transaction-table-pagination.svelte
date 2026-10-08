<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as PaginationPrimitive from '$lib/components/ui/pagination';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getDefaultPageSize } from '$lib/remote-functions/transaction.remote';
	import { PAGE_SIZE_COOKIE_NAME, PAGE_SIZES } from '$lib/utils/page-size';

	let {
		onSetPage,
		onSetPageSize,
		page,
		pageSize,
		total
	}: {
		onSetPage: (page: number) => void;
		onSetPageSize: (pageSize: number) => void;
		page: number;
		pageSize: number;
		total: number;
	} = $props();

	const pageCount = $derived(Math.max(1, Math.ceil(total / pageSize)));
	const isFirstPage = $derived(page === 1);
	const isLastPage = $derived(page === pageCount);

	const pagesInfo: string = $derived.by(() => {
		const p = Math.min(page, pageCount);
		const start = total === 0 ? 0 : (p - 1) * pageSize + 1;
		const end = total === 0 ? 0 : Math.min(start + pageSize - 1, total);
		return m.transactions_pagination_showing({
			end: String(end),
			start: String(start),
			total: String(total)
		});
	});

	// Persist ~400 days so the choice survives sessions (mirrors the theme cookie).
	const COOKIE_MAX_AGE = 34_560_000;

	// Only an explicit dropdown pick is remembered — "load more" below goes
	// through onSetPageSize directly and must never touch the cookie.
	function selectPageSize(next: string) {
		const size = Number(next);
		// No Secure flag: self-hosters serve over plain http (ADR-0010).
		document.cookie = `${PAGE_SIZE_COOKIE_NAME}=${size}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
		// Keep the cached default in step so the rest of this session (URL
		// baseline, other accounts) matches what the next load will read.
		getDefaultPageSize().set(size);
		onSetPageSize(size);
	}

	// Mobile "load more" (ADR-0014): no page numbers on the phone — growing the
	// page size keeps the register URL-driven and simply extends the list.
	const LOAD_MORE_STEP = 15;
	const hasMore = $derived(page * pageSize < total);
</script>

{#if hasMore}
	<Button
		variant="ghost"
		class="h-11 w-full bg-muted/5 @3xl/main:hidden"
		onclick={() => onSetPageSize(pageSize + LOAD_MORE_STEP)}
	>
		{m.transactions_pagination_load_more()}
	</Button>
{/if}

<div class="hidden flex-wrap items-center justify-between gap-3 p-1 @3xl/main:flex">
	<div class="flex items-center gap-2">
		<Select.Root type="single" bind:value={() => pageSize.toString(), selectPageSize}>
			<Select.Trigger
				class="h-auto w-fit border-none bg-transparent px-2 shadow-none"
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

		<div class="hidden text-sm text-muted @3xl/main:block">
			{pagesInfo}
		</div>
	</div>

	<PaginationPrimitive.Root
		class="ml-auto w-fit"
		count={total}
		perPage={pageSize}
		bind:page={() => page, (v) => onSetPage(v)}
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
