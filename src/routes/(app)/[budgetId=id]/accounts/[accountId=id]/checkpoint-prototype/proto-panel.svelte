<!-- PROTOTYPE — debug panel: scenario presets + full state dump. Not part of any variant. -->
<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { asMoney, formatMoney } from '$lib/utils/money';

	import type { ProtoCheckpointState } from './proto-state.svelte';

	let { cp, currency }: { cp: ProtoCheckpointState; currency: (typeof CURRENCIES)[number] } =
		$props();

	let open = $state(true);
	const fmt = (c: number | undefined) =>
		c === undefined ? '—' : formatMoney({ currency, money: asMoney(c) });
</script>

<aside
	class="fixed right-4 bottom-20 z-40 w-80 rounded-sm border-2 border-dashed border-focus/60 bg-surface-high p-2 text-xs shadow-lg"
>
	<button type="button" class="w-full text-left font-bold" onclick={() => (open = !open)}>
		🧪 PROTOTYPE state {open ? '▾' : '▸'}
	</button>
	{#if open}
		<div class="mt-2 grid gap-2">
			<div>
				<div class="mb-1 font-semibold">Scenario: set bank balance as if…</div>
				<div class="flex flex-wrap gap-1">
					{#each cp.presets as p (p.label)}
						<button
							type="button"
							class="rounded-xs bg-muted/10 px-1.5 py-0.5 hover:bg-muted/20"
							onclick={() => (cp.bankInput = p.bank)}>{p.label}</button
						>
					{/each}
				</div>
			</div>
			<dl class="grid grid-cols-[auto_1fr] gap-x-2 font-mono">
				<dt>bank</dt>
				<dd>{fmt(cp.bankInput)}</dd>
				<dt>validated</dt>
				<dd>{fmt(cp.validatedBalance)}</dd>
				<dt>pending</dt>
				<dd>{fmt(cp.pendingBalance)}</dd>
				<dt>difference</dt>
				<dd>{fmt(cp.difference)}</dd>
				<dt>uncovered</dt>
				<dd>{cp.uncoveredPending.length} pending / {cp.uncoveredValidated.length} validated</dd>
				<dt>hints</dt>
				<dd>{cp.hints.map((h) => h.kind).join(', ') || '—'}</dd>
				<dt>checkpoints</dt>
				<dd>
					{#each cp.checkpoints as ck (ck.id)}
						<div>
							{ck.createdAt.slice(0, 10)} · {fmt(ck.bankBalance)} · {ck.coveredIds.length} tx
						</div>
					{/each}
				</dd>
			</dl>
			<div class="max-h-24 overflow-auto font-mono text-muted">
				{#each cp.log as line, i (i)}<div>{line}</div>{/each}
			</div>
		</div>
	{/if}
</aside>
