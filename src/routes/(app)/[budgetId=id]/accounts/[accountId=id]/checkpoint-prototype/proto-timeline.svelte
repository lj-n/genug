<!-- PROTOTYPE — checkpoint history as a vertical timeline, newest first.
     Shared by the F variants. Only the latest checkpoint can be deleted (ADR-0017). -->
<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { Button } from '$lib/components/ui/button';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import { cn } from 'tailwind-variants';

	import type { ProtoCheckpointState } from './proto-state.svelte';

	let {
		cp,
		currency,
		description
	}: {
		cp: ProtoCheckpointState;
		currency: (typeof CURRENCIES)[number];
		description?: string;
	} = $props();

	const fmt = (c: number, signed = false) =>
		formatMoney({
			currency,
			money: asMoney(c),
			options: signed ? { signDisplay: 'exceptZero' } : undefined
		});
	const fmtDate = (iso: string) => formatTransactionDate(parseDate(iso.slice(0, 10)));
</script>

<section id="history" class="grid scroll-mt-8 gap-3">
	<div class="grid gap-1">
		<h2 class="font-display text-lg font-semibold">Previous checkpoints</h2>
		{#if description}<p class="max-w-prose text-sm text-muted">{description}</p>{/if}
	</div>

	{#if cp.checkpoints.length === 0}
		<p class="text-sm text-muted">No checkpoints yet.</p>
	{:else}
		<ol class="ml-1 max-w-2xl border-l border-muted/20">
			{#each [...cp.checkpoints].reverse() as ck, i (ck.id)}
				<li class="relative -ml-px py-2 pl-5">
					<span
						class={cn(
							'absolute top-3.5 -left-1 size-2 rounded-full',
							i === 0 ? 'bg-success' : 'bg-muted/40'
						)}
					></span>
					<div class="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
						<span class="w-24 text-sm">{fmtDate(ck.createdAt)}</span>
						<span class="w-32 text-right font-currency font-medium">{fmt(ck.bankBalance)}</span>
						<span class="text-xs text-muted">
							{ck.coveredCount} sealed{ck.adjustment
								? ` · adjustment ${fmt(ck.adjustment, true)}`
								: ''}
						</span>
						{#if i === 0}
							<Button
								variant="ghost"
								size="xs"
								class="ml-auto text-error"
								onclick={() => confirm('Delete this checkpoint?') && cp.undoLatest()}
							>
								Delete
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</section>
