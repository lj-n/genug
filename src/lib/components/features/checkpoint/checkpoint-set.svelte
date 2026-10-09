<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { Button } from '$lib/components/ui/button';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { m } from '$lib/paraglide/messages';
	import {
		getAccount,
		getAccountBalances,
		getAccounts
	} from '$lib/remote-functions/account.remote';
	import {
		getCheckpointHistory,
		getCheckpointOverview,
		getCheckpointSummary,
		setCheckpoint
	} from '$lib/remote-functions/checkpoint.remote';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { parseDate } from '@internationalized/date';
	import CheckCircleDuotoneIcon from '~icons/ph/check-circle-duotone';
	import StampIcon from '~icons/ph/stamp';

	import { formatAmount } from './format-amount';

	let {
		accountId,
		currency,
		latestCheckpointId,
		overview
	}: {
		accountId: string;
		currency: (typeof CURRENCIES)[number];
		latestCheckpointId: string | undefined;
		overview: Awaited<ReturnType<typeof getCheckpointOverview>>;
	} = $props();

	const form = $derived(setCheckpoint.for(accountId));

	let bankBalance = $state<number>();
	let setCheckpointId = $state<string>();
	// The confirmation goes once its Checkpoint is deleted again.
	const justSet = $derived(
		setCheckpointId !== undefined &&
			setCheckpointId === latestCheckpointId &&
			bankBalance === undefined
	);

	const submit = createFormSubmit(() => form, {
		onSuccess: () => {
			bankBalance = undefined;
			setCheckpointId = form.result?.checkpointId;
		},
		toast: {},
		// Query functions, not instances: the account page's register and
		// balances stay cached for a Back navigation and must not go stale.
		updates: () => [
			getCheckpointOverview,
			getCheckpointHistory,
			getCheckpointSummary,
			getAccount,
			getAccountBalances,
			getAccounts,
			listTransactions
		]
	});

	const adjustment = $derived(
		bankBalance === undefined ? undefined : bankBalance - overview.validatedBalance
	);
	const adjusting = $derived(adjustment !== undefined && adjustment !== 0);

	const seal = $derived(adjusting ? overview.toSealWithAdjustment : overview.toSeal);

	// Below @3xl/main each line stacks: label and description, then the amount.
	// From @3xl/main the lines share the sum's two columns through a subgrid.
	const lineClass =
		'grid items-center gap-1 @3xl/main:col-span-2 @3xl/main:grid-cols-subgrid @3xl/main:gap-x-6';
	const amountClass = 'px-3 text-right font-currency text-3xl';
	const descriptionClass = 'block text-sm text-muted';
</script>

<form {...submit.attrs} class="grid gap-6">
	<input {...form.fields.accountId.as('hidden', accountId)} />

	<dl class="grid gap-4 @3xl/main:grid-cols-[1fr_auto] @3xl/main:gap-y-3">
		<div class={lineClass}>
			<dt>
				{m.checkpoint_validated_label()}
				<span class={descriptionClass}>{m.checkpoint_validated_description()}</span>
			</dt>
			<dd class={amountClass} data-testid="checkpoint-validated">
				{formatAmount(currency, overview.validatedBalance)}
			</dd>
		</div>

		<div class={lineClass}>
			<dt>
				<label for="checkpoint-bank-balance">{m.checkpoint_bank_label()}</label>
				<span id="checkpoint-bank-description" class={descriptionClass}>
					{m.checkpoint_bank_description()}
				</span>
			</dt>
			<dd>
				<InputMoney
					id="checkpoint-bank-balance"
					name={form.fields.bankBalance.as('number').name}
					allowEmpty
					bind:value={bankBalance}
					{currency}
					placeholder={m.checkpoint_bank_placeholder()}
					aria-describedby="checkpoint-bank-description"
					onfocus={() => (setCheckpointId = undefined)}
					class="h-14 w-full text-right font-currency text-3xl placeholder:font-display placeholder:text-base placeholder:text-focus/70 placeholder:italic focus:placeholder:text-transparent data-empty:border-focus/50 data-empty:bg-focus/5 @3xl/main:w-56"
				/>
			</dd>
		</div>

		<div class={[lineClass, 'border-t border-muted/20 pt-4 @3xl/main:pt-3']}>
			<dt>
				{m.checkpoint_adjustment_label()}
				<span class={descriptionClass}>
					{#if adjustment === undefined}
						{m.checkpoint_adjustment_empty()}
					{:else if adjusting}
						{m.checkpoint_adjustment_difference()}
					{:else}
						{m.checkpoint_adjustment_match()}
					{/if}
				</span>
			</dt>
			<dd class={amountClass} data-testid="checkpoint-adjustment">
				{#if adjustment === undefined}
					<span class="text-muted">—</span>
				{:else}
					<span class={adjusting ? undefined : 'text-success'}
						>{formatAmount(currency, adjustment, true)}</span
					>
				{/if}
			</dd>
		</div>
	</dl>

	{#if justSet}
		<p role="status" class="flex items-center gap-2 text-success">
			<CheckCircleDuotoneIcon class="size-6" />
			{m.checkpoint_set_success()}
		</p>
	{:else}
		<p class="flex items-center gap-2 text-sm">
			<StampIcon class="shrink-0 text-muted" />
			<span>
				<span class="font-medium">{m.checkpoint_seal_summary({ count: seal.count })}</span>
				{#if seal.firstDate && seal.lastDate}
					<span class="text-muted">
						·
						{seal.firstDate === seal.lastDate
							? formatTransactionDate(parseDate(seal.firstDate))
							: m.checkpoint_seal_range({
									from: formatTransactionDate(parseDate(seal.firstDate)),
									to: formatTransactionDate(parseDate(seal.lastDate))
								})}
					</span>
				{/if}
			</span>
		</p>
	{/if}

	<Button
		type="submit"
		variant={adjustment === 0 ? 'success' : 'default'}
		disabled={bankBalance === undefined}
		loading={submit.pending}
		{@attach submit.anchor}
	>
		<StampIcon />
		{m.checkpoint_set_button()}
	</Button>
</form>
