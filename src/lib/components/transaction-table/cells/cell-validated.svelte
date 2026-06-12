<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import ValidateCheckbox from './validate-checkbox.svelte';

	let {
		isValidated,
		rowId
	}: {
		isValidated: boolean;
		rowId: string;
	} = $props();

	function toggleValidated() {
		fetch('/api/transaction/validate', {
			body: JSON.stringify({
				transactionIds: [rowId],
				validated: !isValidated
			}),
			method: 'POST'
		}).then((res) => {
			if (res.ok) {
				invalidateAll();
			}
		});
	}
</script>

<div class="grid size-full place-content-center">
	<ValidateCheckbox
		checked={isValidated}
		onclick={toggleValidated}
		aria-label={m.transactions_table_toggle_validated()}
	/>
</div>
