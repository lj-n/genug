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

	export let data: PageData;

	const table = createTable(readable(data.budget));

	const columns = table.createColumns([
		table.column({
			accessor: 'name',
			header: 'Category'
		}),
		table.column({
			accessor: (row) => row,
			header: 'Budget',
			cell: ({ value }) => createRender(BudgetTableForm, { budgetRow: value, data: data.form })
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
										<Render of={cell.render()} />
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
								<Table.Cell {...attrs}>
									{#if cell.id === 'name'}
										<Render of={cell.render()} />
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
