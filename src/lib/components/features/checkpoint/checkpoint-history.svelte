<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';

	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import {
		deleteCheckpoint,
		getCheckpointHistory,
		getCheckpointOverview,
		getCheckpointSummary
	} from '$lib/remote-functions/checkpoint.remote';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';

	import { formatAmount } from './format-amount';

	let {
		currency,
		deletable,
		history
	}: {
		currency: (typeof CURRENCIES)[number];
		/** False on an archived account, which rejects deleting. */
		deletable: boolean;
		history: Awaited<ReturnType<typeof getCheckpointHistory>>;
	} = $props();
</script>

<section id="history" class="grid scroll-mt-8 gap-3">
	<div class="grid gap-1">
		<h2 class="font-display text-lg font-semibold">{m.checkpoint_history_title()}</h2>
		<p class="max-w-prose text-sm text-muted">{m.checkpoint_history_description()}</p>
	</div>

	{#if history.length === 0}
		<p class="text-sm text-muted">{m.checkpoint_history_empty()}</p>
	{:else}
		<ol class="ml-1 max-w-2xl border-l border-muted/20">
			{#each history as checkpoint, index (checkpoint.id)}
				{@const date = formatTransactionDate(checkpoint.createdAt)}
				<li class="relative -ml-px py-2 pl-5">
					<span
						class={[
							'absolute top-3.5 -left-1 size-2 rounded-full',
							index === 0 ? 'bg-success' : 'bg-muted/40'
						]}
					></span>
					<!-- Phone: date | balance, then meta | delete. From @3xl/main: one wrapping line. -->
					<div
						class="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 @3xl/main:flex @3xl/main:flex-wrap"
					>
						<span class="text-sm @3xl/main:w-24">{date}</span>
						<span class="text-right font-currency font-medium @3xl/main:w-32">
							{formatAmount(currency, checkpoint.bankBalance)}
						</span>
						<span class="text-xs text-muted">
							{m.checkpoint_history_sealed({ count: checkpoint.sealedCount })}
							{#if checkpoint.adjustment !== null}
								· {m.checkpoint_history_adjustment({
									amount: formatAmount(currency, checkpoint.adjustment, true)
								})}
							{/if}
						</span>
						{#if index === 0 && deletable}
							<AlertDialogForm
								form={deleteCheckpoint}
								updates={() => [
									getCheckpointOverview,
									getCheckpointHistory,
									getCheckpointSummary,
									listTransactions
								]}
							>
								{#snippet trigger(props)}
									<Button
										{...props}
										variant="ghost"
										size="xs"
										class="-my-1 justify-self-end text-error @3xl/main:ml-auto"
									>
										{m.checkpoint_history_delete()}
									</Button>
								{/snippet}

								{#snippet header()}
									<AlertDialog.Title>{m.checkpoint_delete_title()}</AlertDialog.Title>
									<AlertDialog.Description>
										{m.checkpoint_delete_description({ count: checkpoint.sealedCount, date })}
										{#if checkpoint.adjustment !== null}
											{m.checkpoint_delete_description_adjustment()}
										{/if}
									</AlertDialog.Description>
								{/snippet}

								{#snippet fields()}
									<input {...deleteCheckpoint.fields.checkpointId.as('hidden', checkpoint.id)} />
								{/snippet}

								{#snippet footer({ formId, pending })}
									<Button type="submit" form={formId} variant="destructive" loading={pending}>
										{m.checkpoint_delete_action()}
									</Button>
								{/snippet}
							</AlertDialogForm>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</section>
