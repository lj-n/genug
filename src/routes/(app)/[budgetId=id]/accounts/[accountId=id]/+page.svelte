<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { clickOutside } from '$lib/utils/click-outside';
	import {
		getCoreRowModel,
		type OnChangeFn,
		type RowSelectionState,
		type VisibilityState
	} from '@tanstack/table-core';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { cn } from 'tailwind-variants';

	import type { PageProps } from './$types';

	import { schemaTransactionEdit } from '../../transactions/schema';
	import { setTableContext } from './table-context.svelte';
	import TablePagination from './table-pagination.svelte';
	import { columns } from './transaction-table-columns';

	let { data }: PageProps = $props();

	const tableContext = setTableContext({
		categories: untrack(() => data.categories),
		form: superForm(
			untrack(() => data.formTransactionEdit),
			{
				onUpdated() {
					return tableContext.cancelEdit();
				},
				validators: zod4Client(schemaTransactionEdit)
			}
		)
	});

	const { form } = tableContext;
	const { enhance, form: formData, isTainted, tainted } = form;

	$effect(() => {
		tableContext.categories = data.categories;
	});

	let rowSelection = $state<RowSelectionState>({});
	let onRowSelectionChange: OnChangeFn<RowSelectionState> = $derived((updater) => {
		if (typeof updater === 'function') {
			rowSelection = updater(rowSelection);
		} else {
			rowSelection = updater;
		}
	});

	let columnsVisibility = $state<VisibilityState>({
		selection: false
	});
	let onColumnVisibilityChange: OnChangeFn<VisibilityState> = $derived((updater) => {
		if (typeof updater === 'function') {
			columnsVisibility = updater(columnsVisibility);
		} else {
			columnsVisibility = updater;
		}
	});

	$effect(() => {
		if (tableContext.editingRowId) {
			rowSelection = {};
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
		get onColumnVisibilityChange() {
			return onColumnVisibilityChange;
		},
		get onRowSelectionChange() {
			return onRowSelectionChange;
		},

		state: {
			get columnVisibility() {
				return columnsVisibility;
			},
			get rowSelection() {
				return rowSelection;
			}
		}
	});

	function handleKeyDown(ev: KeyboardEvent) {
		if (tableContext.editingRowId === null) return;
		if (ev.key === 'Escape') {
			tableContext.cancelEdit();
		}
		if (ev.key === 'Enter') {
			submit();
		}
	}

	function submit() {
		tableContext.form.submit();
	}
</script>

<svelte:document onkeydown={handleKeyDown} />

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
							columnsVisibility.selection === false
								? 'grid-cols-[1fr_1fr_0.5fr_0.5fr_3.5rem]'
								: 'grid-cols-[3.5rem_1fr_1fr_0.5fr_0.5fr_3.5rem]',
							'grid items-center rounded-sm border border-muted/10 bg-muted/3'
						)}
					>
						{#each headerGroup.headers as header (header.id)}
							<div
								role="columnheader"
								class={cn(
									'px-4 text-sm font-semibold',
									header.column.columnDef.id === 'date' && 'justify-self-end',
									header.column.columnDef.id === 'amount' && 'justify-self-end',
									header.column.columnDef.id === 'validated' && 'px-2'
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
					{@const isEditing = tableContext.isEditingRow(row.id)}

					<div
						role="row"
						class={cn(
							columnsVisibility.selection === false
								? 'grid-cols-[1fr_1fr_0.5fr_0.5fr_3.5rem]'
								: 'grid-cols-[3.5rem_1fr_1fr_0.5fr_0.5fr_3.5rem]',
							'grid rounded-sm border border-muted/10 bg-surface',
							row.getIsSelected() && 'border-info/20 bg-info/5',
							isEditing && 'border-interactive/30 bg-interactive/5 shadow shadow-interactive/15'
						)}
						data-state={row.getIsSelected() && 'selected'}
						{@attach isEditing &&
							clickOutside({
								callback: tableContext.cancelEdit
							})}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<div role="cell" class={cn('p-2')}>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</div>
						{/each}

						{#if isEditing && isTainted($tainted)}
							<div role="cell" class="col-span-full flex items-center justify-end gap-2 p-2">
								<Button
									variant="ghost"
									onclick={() => {
										tableContext.cancelEdit();
									}}
								>
									{m.cancel()}
								</Button>
								<Button onclick={() => submit()}>
									{m.save()}
								</Button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="grid items-center rounded-sm border border-muted/10 bg-muted/3 px-2">
				<TablePagination {...data.pagination} />
			</div>
		</div>
	</Page.Content>
</Page.Root>

<form
	method="POST"
	action={resolve('/(app)/[budgetId=id]/transactions', { budgetId: data.budget.id })}
	use:enhance
	class="hidden"
>
	<input type="hidden" name="transactionId" bind:value={$formData.transactionId} />
	<input type="hidden" name="accountId" bind:value={$formData.accountId} />
	<input type="hidden" name="categoryId" bind:value={$formData.categoryId} />
	<input type="hidden" name="date" bind:value={$formData.date} />
	<input type="hidden" name="amount" bind:value={$formData.amount} />
	<input type="hidden" name="notes" bind:value={$formData.notes} />
	<input type="hidden" name="validated" bind:value={$formData.validated} />
</form>
