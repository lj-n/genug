<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';

	import { type FilterComponent, getTableContext } from '../context.svelte';

	let { footer, header }: ComponentProps<FilterComponent> = $props();

	const tableContext = getTableContext();
	const filter = tableContext.filter();

	let value = $state<string>(filter.notes ?? '');
</script>

{@render header({
	description: m.transaction_filter_notes_description(),
	title: m.transaction_filter_notes_title()
})}

<form
	onsubmit={(e) => {
		e.preventDefault();
		tableContext.setFilterParams({ notes: value });
		tableContext.filterDialogOpen = false;
	}}
>
	<Input bind:value aria-label={m.transaction_filter_notes_title()} />
	<input type="submit" hidden />
</form>

{@render footer({
	setParams: () => {
		tableContext.setFilterParams({ notes: value });
	}
})}
