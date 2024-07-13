<script lang="ts">
	import {
		createTable,
		Render,
		Subscribe,
		createRender
	} from 'svelte-headless-table';
	import { readable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from './$types';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import BudgetTableForm from './budget.table.form.svelte';
	import BudgetTableName from './budget.table.name.svelte';
	import BudgetCategoryDetail from './budget.category.detail.svelte';
	import { Separator } from '$lib/components/ui/separator';

	export let data: PageData['budget'];

	$: budget = data;

	$: table = createTable(readable(budget));

	$: columns = table.createColumns([
		table.column({
			accessor: (row) => row,
			id: 'name',
			header: 'Category',
			cell: ({ value }) => createRender(BudgetTableName, { row: value })
		}),
		table.column({
			accessor: (row) => row,
			header: 'Budget',
			cell: ({ value }) => createRender(BudgetTableForm, { row: value })
		}),
		table.column({
			accessor: 'activity',
			header: 'Activity',
			cell: ({ value }) => formatFractionToLocaleCurrency(value)
		}),
		table.column({
			accessor: 'rest',
			header: 'Available',
			cell: ({ value }) => formatFractionToLocaleCurrency(value)
		}),
		table.column({
			accessor: (row) => row,
			header: '',
			id: 'details',
			cell: ({ value }) => createRender(BudgetCategoryDetail, { row: value })
		})
	]);

	$: ({ headerRows, pageRows, tableAttrs, tableBodyAttrs } =
		table.createViewModel(columns));
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
										<Render of={cell.render()} />
									{:else if cell.id === 'activity'}
										<div class="hidden text-right md:block">
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
									{:else if cell.id === 'details'}
										<div class="flex gap-2">
											<Separator orientation="vertical" class="h-auto" />
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
