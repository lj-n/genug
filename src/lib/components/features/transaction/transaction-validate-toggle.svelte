<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';

	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getCheckpointSummary, listTransactions } from '$lib/remote-functions/register.remote';
	import { batchValidateTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { cn } from 'tailwind-variants';
	import SealIcon from '~icons/ph/seal';
	import SealCheckDuotoneIcon from '~icons/ph/seal-check-duotone';
	import StampFillIcon from '~icons/ph/stamp-fill';

	import { sealedDate } from './sealed';

	let {
		class: className,
		scope,
		transaction
	}: { class?: string; scope?: string; transaction: ListTransaction } = $props();

	// The desktop row and the mobile card both mount a toggle for the same
	// transaction (one is CSS-hidden); a remote form object attaches to exactly
	// one <form>, so each surface needs its own scoped instance.
	const form = $derived(
		batchValidateTransactions.for(
			scope === undefined ? transaction.id : `${transaction.id}-${scope}`
		)
	);

	// Row-scoped micro-form (ADR-0009): the seal icon flipping with the
	// refreshed list is the success signal; thrown errors go to the toast.
	const submit = createFormSubmit(() => form, {
		toast: {},
		updates: () => [
			listTransactions,
			getAccount(transaction.accountId),
			getAccountBalances(transaction.accountId),
			getCheckpointSummary(transaction.accountId)
		]
	});

	// Only the row's own seal locks the toggle: the uncovered leg of a sealed
	// transfer stays validatable for its account's next Checkpoint (ADR-0017).
	const locked = $derived(transaction.checkpointId !== null);
	const sealedTitle = $derived(
		!transaction.sealed
			? undefined
			: locked
				? m.checkpoint_sealed_title({ date: sealedDate(transaction) })
				: m.checkpoint_sealed_partner_title({ date: sealedDate(transaction) })
	);
</script>

{#snippet sealIcon()}
	<span class="relative">
		{#if transaction.validated}
			<SealCheckDuotoneIcon class="size-6 text-success" />
		{:else}
			<SealIcon class="size-6 text-muted" />
		{/if}
		{#if transaction.sealed}
			<StampFillIcon
				class="absolute -right-1.5 -bottom-1 size-3.5 rounded-full bg-surface p-px text-foreground"
			/>
		{/if}
	</span>
{/snippet}

{#if locked}
	<span
		class={cn(
			'm-auto grid size-8 cursor-not-allowed place-items-center @3xl/main:size-11 @7xl/main:size-8',
			className
		)}
		title={sealedTitle}
	>
		{@render sealIcon()}
		<span class="sr-only">{sealedTitle}</span>
	</span>
{:else}
	<!-- Centering via flex + auto margins (not grid place-content) so a caller's
	     `size-full` override can stretch the button into its cell — the mobile
	     rail relies on that for its full-height tap zone. -->
	<form {...submit.attrs} class="flex size-full">
		<input {...form.fields.validated.as('hidden', !transaction.validated)} />

		<Button
			type="submit"
			name={form.fields.ids[0].as('submit', transaction.id).name}
			value={transaction.id}
			size="icon-lg"
			variant="ghost"
			disabled={submit.pending}
			class={cn(
				'm-auto size-8 rounded-xs hover:bg-transparent @3xl/main:size-11 @7xl/main:size-8',
				className
			)}
			title={sealedTitle}
			aria-label={m.transactions_table_toggle_validated()}
			{@attach submit.anchor}
		>
			{@render sealIcon()}
		</Button>
	</form>
{/if}
