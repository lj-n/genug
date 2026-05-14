<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';

	import { type FilterComponent, getTableContext } from './table-context.svelte';

	let { footer, header }: ComponentProps<FilterComponent> = $props();

	const tableContext = getTableContext();
	const filter = tableContext.filter();

	let value = $state<string>(filter.notes ?? '');
</script>

{@render header({
	description: m.transaction_filter_notes_description(),
	title: m.transaction_filter_notes_title()
})}

<div>
	<Input bind:value />
</div>

{@render footer({
	setParams: () => {
		tableContext.setFilterParams({ notes: value });
	}
})}
