<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { SvelteSet } from 'svelte/reactivity';
	import { cn } from 'tailwind-variants';

	import CellAmount from './cells/cell-amount.svelte';
	import CellCategory from './cells/cell-category.svelte';
	import CellDate from './cells/cell-date.svelte';
	import CellNotes from './cells/cell-notes.svelte';
	import CellSelection from './cells/cell-selection.svelte';
	import CellValidated from './cells/cell-validated.svelte';
	import ValidateCheckbox from './cells/validate-checkbox.svelte';
	import { setCellContext } from './context.svelte';
	import CreateTransaction from './create-transaction.svelte';
	import EditTransactionRow from './edit-transaction-row.svelte';
	import Filter from './filter/filter.svelte';
	import Pagination from './pagination.svelte';
	import { schemaURLParams } from './schema';

	let { accountId, budgetId }: { accountId: string; budgetId: string } = $props();

	const id = $props.id();

	// ── Editing-State ───────────────────────────────────────────
	let editingRowId = $state<null | string>(null);
	let selectedRowIds = $state(new Set<string>());
	let showSelection = $state(false);
	let createFormOpen = $state(false);

	function editRow(rowId: string) {
		selectedRowIds = new Set();
		editingRowId = rowId;
	}

	setCellContext({
		get budgetId() {
			return budgetId;
		},
		editRow
	});

	// ── URL-Parameter lesen ─────────────────────────────────────
	const urlParams = $derived(
		schemaURLParams.parse({
			categoryId: page.url.searchParams.getAll('categoryId'),
			notes: page.url.searchParams.get('notes'),
			page: page.url.searchParams.get('page'),
			pageSize: page.url.searchParams.get('pageSize'),
			sortAccount: page.url.searchParams.get('sortAccount'),
			sortCategory: page.url.searchParams.get('sortCategory'),
			sortDate: page.url.searchParams.get('sortDate'),
			sortValidated: page.url.searchParams.get('sortValidated')
		})
	);

	// ── Daten ───────────────────────────────────────────────────
	const result = $derived(
		await listTransactions({
			accountId,
			categoryId: urlParams.categoryId,
			notes: urlParams.notes,
			page: urlParams.page,
			pageSize: urlParams.pageSize,
			sortAccount: urlParams.sortAccount,
			sortCategory: urlParams.sortCategory,
			sortDate: urlParams.sortDate,
			sortValidated: urlParams.sortValidated
		})
	);

	// ── Selection- und Grid-State ───────────────────────────────
	function toggleRow(transactionId: string) {
		const next = new SvelteSet(selectedRowIds);
		if (next.has(transactionId)) {
			next.delete(transactionId);
		} else {
			next.add(transactionId);
		}
		selectedRowIds = next;
	}

	function toggleAll() {
		if (selectedRowIds.size === result.transactions.length) {
			selectedRowIds = new Set();
		} else {
			selectedRowIds = new Set(result.transactions.map((t) => t.id));
		}
	}

	const allPageRowsSelected = $derived(
		result.transactions.length > 0 && selectedRowIds.size === result.transactions.length
	);

	const somePageRowsSelected = $derived(selectedRowIds.size > 0 && !allPageRowsSelected);

	const gridColsClass = $derived(
		showSelection
			? 'grid-cols-[3.5rem_1fr_1fr_0.5fr_0.5fr_3.5rem]'
			: 'grid-cols-[1fr_1fr_0.5fr_0.5fr_3.5rem]'
	);
</script>

<div class="flex gap-2">
	<Filter {budgetId} />
	<CreateTransaction {budgetId} to="#{id}-create-row" bind:open={createFormOpen} />
</div>

<div role="table" class="space-y-2">
	<div role="rowgroup">
		<div
			role="row"
			class={cn(gridColsClass, 'grid items-center rounded-sm border border-muted/10 bg-muted/3')}
		>
			{#if showSelection}
				<div role="columnheader">
					<CellSelection
						aria-label={m.transactions_table_select_all()}
						checked={allPageRowsSelected}
						indeterminate={somePageRowsSelected}
						onCheckedChange={toggleAll}
					/>
				</div>
			{/if}
			<div role="columnheader" class="px-4 text-sm font-semibold">
				{m.transactions_table_header_category()}
			</div>
			<div role="columnheader" class="px-4 text-sm font-semibold">
				{m.transactions_table_header_notes()}
			</div>
			<div role="columnheader" class="justify-self-end px-4 text-sm font-semibold">
				{m.transactions_table_header_date()}
			</div>
			<div role="columnheader" class="justify-self-end px-4 text-sm font-semibold">
				{m.transactions_table_header_amount()}
			</div>
			<div role="columnheader" class="px-2 text-sm font-semibold">
				<ValidateCheckbox checked={true} disabled={true} />
			</div>
		</div>
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

		{#each result.transactions as transaction (transaction.id)}
			{#if editingRowId === transaction.id}
				<EditTransactionRow
					{transaction}
					{budgetId}
					{gridColsClass}
					onCancel={() => {
						editingRowId = null;
					}}
				/>
			{:else}
				<div
					role="row"
					class={cn(
						gridColsClass,
						'grid rounded-sm border border-muted/10 bg-surface',
						selectedRowIds.has(transaction.id) && 'border-info/20'
					)}
					data-state={selectedRowIds.has(transaction.id) && 'selected'}
				>
					{#if showSelection}
						<div role="cell" class="p-2">
							<CellSelection
								checked={selectedRowIds.has(transaction.id)}
								onCheckedChange={() => toggleRow(transaction.id)}
							/>
						</div>
					{/if}

					<div role="cell" class="p-2">
						<CellCategory categoryName={transaction.categoryName} rowId={transaction.id} />
					</div>
					<div role="cell" class="p-2">
						<CellNotes notes={transaction.notes ?? ''} rowId={transaction.id} />
					</div>
					<div role="cell" class="p-2">
						<CellDate date={transaction.date} rowId={transaction.id} />
					</div>
					<div role="cell" class="p-2">
						<CellAmount amount={transaction.amount} rowId={transaction.id} />
					</div>
					<div role="cell" class="p-2">
						<CellValidated isValidated={transaction.validated} rowId={transaction.id} />
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<div class="grid items-center rounded-sm border border-muted/10 bg-muted/3 px-2">
		<Pagination pagination={result.pagination} />
	</div>
</div>
