<!-- Chrome-less month stats ledger for the budget table's category popover: the
     same flat zebra "open ledger" rows the category detail page wears (#280), so
     the glance surface and the detail page read the same. Just the viewed
     month's rows — Average, Spend-vs, Target — since the popover header already
     names the category and month, and the glance stays quick. The target row
     reads out the saved-of-target amounts, not just the bare percentage. -->
<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getCategoryStats } from '$lib/remote-functions/category.remote';
	import { clamp } from '$lib/utils/clamp';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { addMonths, formatMonth, type Month } from '$lib/utils/month';

	let {
		categoryId,
		currency,
		month
	}: {
		categoryId: string;
		currency: (typeof CURRENCIES)[number];
		month: Month;
	} = $props();

	const stats = $derived(await getCategoryStats({ categoryId, month }));

	// Same row chrome as the detail page's stats ledger (#280): no dividers, an
	// even-row tint for scanability (P5's zebra idiom), a touch of inset padding.
	const rowChrome = 'rounded px-2 py-1.5 even:bg-muted/3';
</script>

<dl class="flex flex-col">
	<div class="{rowChrome} flex items-baseline justify-between">
		<dt class="text-sm text-muted">{m.category_stats_average()}</dt>
		<dd class="font-currency">
			{stats.trailingAverageSpend === null
				? '—'
				: formatMoney({ currency, money: asMoney(stats.trailingAverageSpend) })}
		</dd>
	</div>

	<div class="{rowChrome} flex flex-col gap-0.5">
		<div class="flex items-baseline justify-between">
			<dt class="text-sm text-muted">
				{m.category_stats_delta({
					month: formatMonth({
						month: addMonths(month, -1),
						options: { month: 'short', year: 'numeric' }
					})
				})}
			</dt>
			<dd class="font-currency">
				{stats.spendDelta > 0 ? '+' : ''}{formatMoney({
					currency,
					money: asMoney(stats.spendDelta)
				})}
			</dd>
		</div>
		<div class="font-currency text-xs text-foreground/60">
			{m.category_stats_delta_breakdown({
				currentSpend: formatMoney({ currency, money: asMoney(stats.monthSpend) }),
				previousSpend: formatMoney({ currency, money: asMoney(stats.previousMonthSpend) })
			})}
		</div>
	</div>

	{#if stats.currentTargetPercentage !== null && stats.targetBalance !== null}
		{@const clamped = clamp(stats.currentTargetPercentage, 0, 100)}
		<!-- The target row reads out the saved-of-target amounts above a full-width
		     bar — so the glance shows how much is set aside toward the target, not
		     just a bare percentage. -->
		<div class="{rowChrome} flex flex-col gap-1">
			<div class="flex items-baseline justify-between">
				<dt class="text-sm text-muted">{m.category_stats_target_percentage()}</dt>
				<dd class="font-currency text-sm">
					{m.category_stats_target_amount({
						saved: formatMoney({ currency, money: asMoney(stats.currentTargetSaved) }),
						target: formatMoney({ currency, money: asMoney(stats.targetBalance) })
					})}
				</dd>
			</div>
			<div class="flex items-center gap-2">
				<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/20">
					<div class="h-full bg-success" style="width: {clamped}%"></div>
				</div>
				<span class="font-currency text-xs text-muted">{stats.currentTargetPercentage}%</span>
			</div>
		</div>
	{/if}
</dl>
