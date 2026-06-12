<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';

	import { colsClass } from './utils';
	import ValidationCheckbox from './validation-checkbox.svelte';
</script>

<div role="rowgroup">
	<div role="row" class={cn(colsClass, 'grid items-center rounded-lg bg-muted/5')}>
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
			<ValidationCheckbox checked={true} disabled={true} />
		</div>
	</div>
</div>
