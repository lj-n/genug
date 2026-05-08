<script lang="ts">
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Page from '$lib/components/ui/page';
	import { getCoreRowModel, type OnChangeFn, type RowSelectionState } from '@tanstack/table-core';
	import { cn } from 'tailwind-variants';

	import type { PageProps } from './$types';

	import TablePagination from './table-pagination.svelte';
	import { columns } from './transaction-table-columns';

	let { data }: PageProps = $props();

	let rowSelection = $state<RowSelectionState>({});
	let onRowSelectionChange: OnChangeFn<RowSelectionState> = $derived((updater) => {
		if (typeof updater === 'function') {
			rowSelection = updater(rowSelection);
		} else {
			rowSelection = updater;
		}
	});

	const table = createSvelteTable({
		columns,
		get data() {
			return data.transactions;
		},
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id,
		manualPagination: true,
		manualSorting: true,
		get onRowSelectionChange() {
			return onRowSelectionChange;
		},
		state: {
			get rowSelection() {
				return rowSelection;
			}
		}
	});
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{data.account.name}
		</Page.Title>
	</Page.Header>

	<Page.Content>
		<div role="table" class="space-y-2">
			<div role="rowgroup">
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<div
						role="row"
						class={cn(
							'grid grid-cols-[3.5rem_1fr_1fr_0.5fr_0.5fr_3.5rem] items-center rounded-sm border border-muted/10 bg-muted/3'
						)}
					>
						{#each headerGroup.headers as header (header.id)}
							<div
								role="columnheader"
								class={cn(
									'px-2 text-sm font-semibold',
									header.column.columnDef.id === 'date' && 'justify-self-end',
									header.column.columnDef.id === 'amount' && 'justify-self-end'
								)}
							>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</div>
						{/each}
					</div>
				{/each}
			</div>

			<div role="rowgroup" class="grid space-y-1.5">
				{#each table.getRowModel().rows as row (row.id)}
					<div
						role="row"
						class={cn(
							'grid grid-cols-[3.5rem_1fr_1fr_0.5fr_0.5fr_3.5rem] rounded-sm border border-muted/10 bg-surface',
							row.getIsSelected() && 'border-interactive/20 bg-interactive/5'
						)}
						data-state={row.getIsSelected() && 'selected'}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<div role="cell" class={cn('p-2')}>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</div>
						{/each}
					</div>
				{/each}
			</div>

			<div class="grid items-center rounded-sm border border-muted/10 bg-muted/3 px-2">
				<TablePagination {...data.pagination} />
			</div>
		</div>
	</Page.Content>
</Page.Root>
