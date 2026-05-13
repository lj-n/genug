<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { clickOutside } from '$lib/utils/click-outside';
	import {
		getCoreRowModel,
		type OnChangeFn,
		type RowSelectionState,
		type VisibilityState
	} from '@tanstack/table-core';
	import { flip } from 'svelte/animate';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { cn } from 'tailwind-variants';
	import PhChartLineUp from '~icons/ph/chart-line-up';
	import PhTrash from '~icons/ph/trash';

	import type { PageProps } from './$types';

	import { schemaTransactionEdit } from '../../transactions/schema';
	import AccountBalances from './account-balances.svelte';
	import { setTableContext, TableContext } from './table-context.svelte';
	import TableCreateTransaction from './table-create-transaction.svelte';
	import TableFilter from './table-filter.svelte';
	import TablePagination from './table-pagination.svelte';
	import { columns } from './transaction-table-columns';

	let { data }: PageProps = $props();

	const id = $props.id();

	const tableContext = setTableContext(
		new TableContext(
			() => data.categories,
			() =>
				superForm(data.formTransactionEdit, {
					onUpdated() {
						tableContext.cancelEditing();
					},
					validators: zod4Client(schemaTransactionEdit)
				}),
			() => data.filter,
			() => data.transactions
		)
	);

	const { editForm } = tableContext;
	const { enhance, form: formData } = editForm();

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

	let gridColsClass = $derived(
		columnsVisibility.selection === false
			? 'grid-cols-[1fr_1fr_0.5fr_0.5fr_3.5rem]'
			: 'grid-cols-[3.5rem_1fr_1fr_0.5fr_0.5fr_3.5rem]'
	);
	let onColumnVisibilityChange: OnChangeFn<VisibilityState> = $derived((updater) => {
		if (typeof updater === 'function') {
			columnsVisibility = updater(columnsVisibility);
		} else {
			columnsVisibility = updater;
		}
	});

	let createFormOpen = $state(false);

	$effect(() => {
		if (tableContext.editing) {
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
		manualFiltering: true,
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
		if (!tableContext.editing) return;
		if (ev.key === 'Escape') {
			tableContext.cancelEditing();
		}
		if (ev.key === 'Enter') {
			submit();
		}
	}

	function submit() {
		tableContext.editForm().submit();
	}

	function deleteTransaction(id: string) {
		fetch('/api/transaction/delete', {
			body: JSON.stringify({
				transactionIds: [id]
			}),
			method: 'POST'
		}).then((res) => {
			if (res.ok) {
				invalidateAll();
				tableContext.cancelEditing();
			}
		});
	}
</script>

<svelte:document onkeydown={handleKeyDown} />

<Page.Root>
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{data.account.name}
		</Page.Title>

		<Button
			variant="ghost"
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/detail', {
				accountId: data.account.id,
				budgetId: data.budget.id
			})}
		>
			<PhChartLineUp class="size-6 text-muted" />
			{m.account_details()}
		</Button>
	</Page.Header>

	<Page.Content>
		<AccountBalances balances={data.balances} />

		<Separator orientation="horizontal" />

		<div class="flex gap-2">
			<TableFilter />

			<TableCreateTransaction
				categories={data.categories}
				form={data.formTransactionCreate}
				to="#{id}-create-row"
				bind:open={createFormOpen}
			/>
		</div>

		<div role="table" class="space-y-2">
			<div role="rowgroup">
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<div
						role="row"
						class={cn(
							gridColsClass,
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
				<div
					role="row"
					aria-hidden={!createFormOpen}
					id="{id}-create-row"
					class={cn(
						gridColsClass,
						'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15',
						!createFormOpen && 'hidden'
					)}
				></div>

				{#each table.getRowModel().rows as row (row.id)}
					{@const isEditing = tableContext.isEditingRow(row.id)}

					<div
						animate:flip={{ duration: 150 }}
						role="row"
						class={cn(
							gridColsClass,
							'grid rounded-sm border border-muted/10 bg-surface',
							row.getIsSelected() && 'border-info/20',
							isEditing && 'border-interactive/30 shadow shadow-interactive/15'
						)}
						data-state={row.getIsSelected() && 'selected'}
						{@attach isEditing &&
							clickOutside({
								callback: tableContext.cancelEditing
							})}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<div role="cell" class={cn('p-2', isEditing && 'bg-interactive/5')}>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</div>
						{/each}

						{#if isEditing}
							<div
								role="cell"
								class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2"
							>
								<Button
									variant="ghost"
									onclick={() => {
										tableContext.cancelEditing();
									}}
								>
									{m.cancel()}
								</Button>

								<Button variant="destructive" size="icon" onclick={() => deleteTransaction(row.id)}>
									<PhTrash />
									<span class="sr-only">
										{m.delete()}
									</span>
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
