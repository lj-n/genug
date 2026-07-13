<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';

	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { batchValidateTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import SealIcon from '~icons/ph/seal';
	import SealCheckDuotoneIcon from '~icons/ph/seal-check-duotone';

	let { transaction }: { transaction: ListTransaction } = $props();

	const form = $derived(batchValidateTransactions.for(transaction.id));

	// Row-scoped micro-form (ADR-0009): the seal icon flipping with the
	// refreshed list is the success signal; thrown errors go to the toast.
	const submit = createFormSubmit(() => form, { toast: {} });
</script>

<form {...submit.attrs} class="grid size-full place-content-center">
	<input {...form.fields.validated.as('hidden', !transaction.validated)} />

	<Button
		type="submit"
		name={form.fields.ids.as('select multiple').name}
		value={[transaction.id]}
		size="icon-lg"
		variant="ghost"
		disabled={submit.pending}
		class="rounded-xs hover:bg-transparent"
		aria-label={m.transactions_table_toggle_validated()}
		{@attach submit.anchor}
	>
		{#if transaction.validated}
			<SealCheckDuotoneIcon class="size-6 text-success" />
		{:else}
			<SealIcon class="size-6 text-muted" />
		{/if}
	</Button>
</form>
