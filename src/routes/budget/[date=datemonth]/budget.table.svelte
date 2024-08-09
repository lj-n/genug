<script lang="ts">
	import {
		createTable,
		Render,
		Subscribe,
		createRender
	} from 'svelte-headless-table';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from './$types';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import BudgetTableForm from './budget.table.form.svelte';
	import BudgetTableName from './budget.table.name.svelte';
	import LucidePackage from '~icons/lucide/package';
	import LucidePackageOpen from '~icons/lucide/package-open';
	import LucidePackagePlus from '~icons/lucide/package-plus';
	import LucideFolder from '~icons/lucide/folder';
	export let budget: PageData['budget'];

	const tableData = writable(budget);

	$: tableData.set(budget);

	const table = createTable(tableData);

	const columns = table.createColumns([
		table.column({
			accessor: (row) => row,
			id: 'name',
			header: 'Category',
			cell: ({ value }) => createRender(BudgetTableName, { row: value })
		}),
		table.column({
			accessor: (row) => row,
			id: 'budget',
			header: 'Budget',
			cell: ({ value }) => createRender(BudgetTableForm, { row: value })
		}),
		table.column({
			accessor: 'activity',
			id: 'activity',
			header: 'Activity',
			cell: ({ value }) => formatFractionToLocaleCurrency(value)
		}),
		table.column({
			accessor: 'rest',
			id: 'rest',
			header: 'Available',
			cell: ({ value }) => formatFractionToLocaleCurrency(value)
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
		table.createViewModel(columns);
</script>

<div class="rounded-md border">
	<Table.Root {...$tableAttrs}>
		<Table.Header>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<Table.Row>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
								<Table.Head {...attrs}>
									{#if cell.id === 'name'}
										<div class="flex items-center gap-1">
											<LucideFolder />
											<Render of={cell.render()} />
										</div>
									{:else if cell.id === 'budget'}
										<div class="flex items-center justify-end gap-1">
											<LucidePackage />
											<Render of={cell.render()} />
										</div>
									{:else if cell.id === 'activity'}
										<div class="hidden items-center justify-end gap-1 md:flex">
											<LucidePackageOpen />
											<Render of={cell.render()} />
										</div>
									{:else if cell.id === 'rest'}
										<div class="flex items-center justify-end gap-1">
											<LucidePackagePlus />
											<Render of={cell.render()} />
										</div>
									{:else}
										<div class="text-right">
											<Render of={cell.render()} />
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
					<Table.Row {...rowAttrs}>
						{#each row.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs>
								<Table.Cell
									{...attrs}
									class={cell.id === 'details' ? 'w-0 min-w-fit' : ''}
								>
									{#if cell.id === 'name'}
										<Render of={cell.render()} />
									{:else if cell.id === 'activity'}
										<div
											class="hidden text-right font-semibold tabular-nums md:block"
										>
											<Render of={cell.render()} />
										</div>
									{:else}
										<div class="text-right font-semibold tabular-nums">
											<Render of={cell.render()} />
										</div>
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
