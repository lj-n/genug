<!-- PROTOTYPE Variant F1 — "Intro + big summary". E2's flow, left-aligned. A
     short intro under the title says what a checkpoint is. The sum is
     genug − bank input, with the Adjustment under the line as the result; it and
     the button are always shown. The empty input shows a placeholder and is
     highlighted as the first call to action. Timeline at the bottom. -->
<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { InputMoney } from '$lib/components/ui/input-money';
	import * as Page from '$lib/components/ui/page';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import { cn } from 'tailwind-variants';
	import ArrowLeftIcon from '~icons/ph/arrow-left';
	import CheckCircleDuotoneIcon from '~icons/ph/check-circle-duotone';
	import FlagCheckeredIcon from '~icons/ph/flag-checkered';
	import LockSimpleIcon from '~icons/ph/lock-simple';

	import type { ProtoCheckpointState } from './proto-state.svelte';

	import ProtoTimeline from './proto-timeline.svelte';

	let {
		accountId,
		accountName,
		budgetId,
		cp,
		currency
	}: {
		accountId: string;
		accountName: string;
		budgetId: string;
		cp: ProtoCheckpointState;
		currency: (typeof CURRENCIES)[number];
	} = $props();

	const fmt = (c: number, signed = false) =>
		formatMoney({
			currency,
			money: asMoney(c),
			options: signed ? { signDisplay: 'exceptZero' } : undefined
		});
	const fmtDate = (iso: string) => formatTransactionDate(parseDate(iso.slice(0, 10)));

	let justSet = $state(false);
	let focused = $state(false);
	const empty = $derived(cp.bankInput === undefined);
	const covered = $derived(cp.uncoveredValidated);
	const dates = $derived(covered.map((t) => t.date).sort());
	const adjusting = $derived(cp.difference !== undefined && cp.difference !== 0);
	const count = $derived(covered.length + (adjusting ? 1 : 0));

	// Phone (below @3xl/main): each line stacks label over amount (question 3, M1).
	const amount = 'px-3 text-right font-currency text-3xl';
	const group = 'not-first:mt-4 @3xl/main:not-first:mt-0';

	function set() {
		cp.setCheckpoint();
		justSet = true;
	}
</script>

<Page.Root>
	<Page.Header>
		<a
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId, budgetId })}
			class="flex items-center gap-1 text-sm text-muted hover:text-foreground"
		>
			<ArrowLeftIcon />
			{accountName}
		</a>
		<Page.Title>Checkpoint</Page.Title>
		<Page.Description class="max-w-prose">
			A checkpoint confirms that {accountName} in
			<span class="font-display font-bold text-success">genug</span> matches your bank on a given day.
			Every validated transaction up to that point gets sealed: amount, date and account can't change
			any more. Category and notes stay editable.
		</Page.Description>
		<Page.Description class="max-w-prose">
			Off by a bit? No need to hunt for the cause. The checkpoint books an Adjustment for the
			difference, and adjusting from time to time is perfectly fine.
		</Page.Description>
	</Page.Header>

	<Page.Content class="grid max-w-xl gap-8 pt-4">
		<div class="grid gap-6">
			<dl
				class="grid grid-cols-1 items-center gap-x-6 gap-y-1 @3xl/main:grid-cols-[1fr_auto] @3xl/main:gap-y-3"
			>
				<div class={group}>
					<dt class="text-base">Validated in genug</dt>
					<dd class="text-sm text-muted">Sum of every transaction you've validated.</dd>
				</div>
				<dd class={amount}>{fmt(cp.validatedBalance)}</dd>

				<div class={group}>
					<dt class="text-base">
						<label for="bank-balance">Your bank</label>
					</dt>
					<dd class="text-sm text-muted">Current balance in your banking app.</dd>
				</div>
				<dd class="relative">
					<InputMoney
						id="bank-balance"
						bind:value={cp.bankInput}
						{currency}
						class={cn(
							'h-14 w-full text-right font-currency text-3xl @3xl/main:w-56',
							// First call to action: tinted until a balance is entered.
							empty && 'border-focus/50 bg-focus/5',
							empty && !focused && 'text-transparent'
						)}
						onfocus={() => {
							justSet = false;
							focused = true;
						}}
						onblur={() => (focused = false)}
					/>
					{#if empty && !focused}
						<!-- InputMoney always shows €0.00 (hidden above); show a placeholder instead. -->
						<span
							class="pointer-events-none absolute inset-0 flex items-center justify-end px-3 font-display text-base whitespace-nowrap text-focus/70 italic"
						>
							Enter balance
						</span>
					{/if}
				</dd>

				<div class="mt-4 border-t border-muted/20 @3xl/main:col-span-2 @3xl/main:mt-0"></div>
				<div class={group}>
					<dt class="text-base">Adjustment</dt>
					<dd class="text-sm text-muted">
						{#if empty}
							The difference, once you've entered your balance.
						{:else if adjusting}
							Booked as one transaction without a category, so both sides match.
						{:else}
							Both sides match. Nothing to book.
						{/if}
					</dd>
				</div>
				<dd class={amount}>
					{#if empty}
						<span class="text-muted">—</span>
					{:else}
						<span class={adjusting ? '' : 'text-success'}>{fmt(cp.difference ?? 0, true)}</span>
					{/if}
				</dd>
			</dl>

			{#if justSet && empty}
				<div class="flex items-center gap-2 text-success">
					<CheckCircleDuotoneIcon class="size-6" /> Checkpoint set.
				</div>
			{:else}
				<p class="flex items-center gap-2 text-sm">
					<LockSimpleIcon class="shrink-0 text-muted" />
					<span>
						Seals <span class="font-medium">{count} transaction{count === 1 ? '' : 's'}</span>
						{#if dates.length}<span class="text-muted">
								· {fmtDate(dates[0])} – {fmtDate(dates.at(-1)!)}</span
							>{/if}
					</span>
				</p>
			{/if}
			<Button
				variant={cp.difference === 0 ? 'success' : 'default'}
				class="w-fit"
				disabled={empty}
				onclick={set}
			>
				<FlagCheckeredIcon /> Set checkpoint
			</Button>
		</div>

		<ProtoTimeline
			{cp}
			{currency}
			description="Each entry is the bank balance you confirmed. Only the latest checkpoint can be deleted; that unseals its transactions again."
		/>
	</Page.Content>
</Page.Root>
