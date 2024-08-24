<script lang="ts">
	import {
		createTable,
		Render,
		Subscribe,
		createRender
	} from 'svelte-headless-table';
	import {
		addColumnFilters,
		addPagination,
		addSelectedRows
	} from 'svelte-headless-table/plugins';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from './$types';
	import TransactionsLabel from './transactions.table.label.svelte';
	import TransactionsStatus from './transactions.status.svelte';
	import DataTableCheckbox from './transactions.table.select.svelte';
	import TransactionsEdit from './transactions.table.edit.svelte';
	import Actions from './transactions.actions.svelte';
	import Pagination from './transactions.table.pagination.svelte';
	import SelectFilter from './transactions.select.filter.svelte';

	export let data: PageData;
	$: ({ validateForm } = data);

	const tableData = writable(data.transactions);
	$: tableData.set(data.transactions);

	const serverItemCount = writable(data.totalTransactionCount);
	$: serverItemCount.set(data.totalTransactionCount);

	const table = createTable(tableData, {
		select: addSelectedRows(),
		page: addPagination({
			serverSide: true,
			serverItemCount
		}),
		filter: addColumnFilters({
			serverSide: true
		})
	});

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: (_, { pluginStates }) => {
				const { allPageRowsSelected } = pluginStates.select;
				return createRender(DataTableCheckbox, {
					checked: allPageRowsSelected
				});
			},
			cell: ({ row }, { pluginStates }) => {
				const { getRowState } = pluginStates.select;
				const { isSelected } = getRowState(row);

				return createRender(DataTableCheckbox, {
					checked: isSelected
				});
			}
		}),
		table.column({
			accessor: (row) => row,
			id: 'transaction',
			header: 'Transaction',
			cell: ({ value }) =>
				createRender(TransactionsLabel, { transaction: value })
		}),
		table.column({
			accessor: 'category',
			id: 'category',
			header: 'Category',
			cell: ({ value }) => value?.name ?? 'Without Category',
			plugins: {
				filter: {
					fn: ({ value }) => true,
					initialFilterValue: [],
					render: () =>
						createRender(SelectFilter, {
							data: data.categories,
							searchParamName: 'categories',
							label: 'Categories'
						})
				}
			}
		}),
		table.column({
			accessor: 'account',
			id: 'account',
			header: 'Account',
			cell: ({ value }) => value?.name ?? '',
			plugins: {
				filter: {
					fn: () => true,
					initialFilterValue: [],
					render: () =>
						createRender(SelectFilter, {
							data: data.accounts,
							searchParamName: 'accounts',
							label: 'Accounts'
						})
				}
			}
		}),
		table.column({
			accessor: 'date',
			id: 'date',
			header: 'Date'
		}),
		table.column({
			accessor: (row) => row,
			id: 'validated',
			header: 'Status',
			cell: ({ value }) =>
				createRender(TransactionsStatus, { transaction: value }),
			plugins: {
				filter: {
					fn: () => true,
					initialFilterValue: [],
					render: () =>
						createRender(SelectFilter, {
							data: [
								{ id: 'pending', name: 'Pending' },
								{ id: 'validated', name: 'Validated' }
							],
							searchParamName: 'status',
							label: 'Status'
						})
				}
			}
		}),
		table.column({
			accessor: (row) => row,
			header: '',
			id: 'edit',
			cell: ({ value }) => {
				return createRender(TransactionsEdit, { transaction: value });
			}
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
		table.createViewModel(columns, { rowDataId: (row) => row.id.toString() });

	const { selectedDataIds } = pluginStates.select;

	$: selectedTransactions = data.transactions.filter(
		(t) => $selectedDataIds[t.id] === true
	);
</script>

<Actions {selectedTransactions} {validateForm} />

<div class="rounded-md border">
	<Table.Root {...$tableAttrs} class="table-fixed">
		<colgroup>
			<col class="w-14" />
			<col class="ten" />
			<col class="ten" />
			<col class="twenty" />
			<col class="twenty" />
			<col class="twenty" />
			<col class="w-14" />
		</colgroup>
		<Table.Header>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<Table.Row>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe
								attrs={cell.attrs()}
								let:attrs
								props={cell.props()}
								let:props
							>
								<Table.Head
									{...attrs}
									class="align-middle [&:has([role=checkbox])]:pl-3"
								>
									{#if cell.id === 'date' || cell.id === 'validated'}
										<div class="flex items-center gap-2 py-2">
											<Render of={cell.render()} />
											{#if props.filter?.render}
												<Render of={props.filter.render} />
											{/if}
										</div>
									{:else}
										<div class="flex items-center gap-2 py-2">
											<Render of={cell.render()} />
											{#if props.filter?.render}
												<Render of={props.filter.render} />
											{/if}
										</div>
									{/if}
								</Table.Head>
							</Subscribe>
						{/each}
					</Table.Row>
				</Subscribe>
			{/each}
		</Table.Header>
		<Table.Body {...$tableBodyAttrs}>
			{#each $pageRows as row (row.id)}
				<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
					<Table.Row
						{...rowAttrs}
						data-state={$selectedDataIds[row.id] && 'selected'}
					>
						{#each row.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs>
								<Table.Cell {...attrs}>
									{#if cell.id === 'date' || cell.id === 'validated'}
										<div class="text-right">
											<Render of={cell.render()} />
										</div>
									{:else}
										<Render of={cell.render()} />
									{/if}
								</Table.Cell>
							</Subscribe>
						{/each}
					</Table.Row>
				</Subscribe>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<Pagination {data} paginationState={pluginStates.page} />
