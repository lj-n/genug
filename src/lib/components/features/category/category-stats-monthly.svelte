<!-- Chrome-less month-scoped stats fragment shared by the stats tile and the
     budget table's category popover. Consumers provide their own chrome and
     month label; the all-time group stays in category-stats.svelte. -->
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

	// The tallest bar spans the full sparkline height; the floor of 1 avoids
	// dividing by zero when every month is empty.
	const maxSpend = $derived(Math.max(...stats.sparkline.map((b) => b.spend), 1));
</script>

<svg
	viewBox="0 0 118 40"
	preserveAspectRatio="none"
	role="img"
	aria-label={m.category_stats_sparkline_label()}
	class="h-16 w-full"
>
	{#each stats.sparkline as bucket, i (bucket.month)}
		<!-- Refund-positive and empty months clamp to a baseline stub so a
		     dormant stretch reads as a flat tail, not missing pixels. -->
		{@const barHeight = Math.max((Math.max(bucket.spend, 0) / maxSpend) * 38, 1.5)}
		<rect
			x={i * 10}
			y={40 - barHeight}
			width="8"
			height={barHeight}
			rx="1"
			class={i === stats.sparkline.length - 1 ? 'fill-info/30' : 'fill-info/70'}
		>
			<title>
				{formatMonth({ month: bucket.month, options: { month: 'short', year: 'numeric' } })}: {formatMoney(
					{ currency, money: asMoney(bucket.spend) }
				)}
			</title>
		</rect>
	{/each}
</svg>

<div class="grid grid-cols-2 gap-2">
	<div class="rounded-md border border-info/20 bg-info/10 p-2 text-center">
		<div class="font-currency text-xl">
			{stats.trailingAverageSpend === null
				? '—'
				: formatMoney({ currency, money: asMoney(stats.trailingAverageSpend) })}
		</div>
		<div class="text-sm">{m.category_stats_average()}</div>
	</div>

	<div class="rounded-md border border-info/20 bg-info/10 p-2 text-center">
		<div class="font-currency text-xl">
			{stats.spendDelta > 0 ? '+' : ''}{formatMoney({
				currency,
				money: asMoney(stats.spendDelta)
			})}
		</div>
		<div class="text-sm">
			{m.category_stats_delta({
				month: formatMonth({
					month: addMonths(month, -1),
					options: { month: 'short', year: 'numeric' }
				})
			})}
		</div>
		<div class="font-currency text-xs text-foreground/60">
			{m.category_stats_delta_breakdown({
				currentSpend: formatMoney({ currency, money: asMoney(stats.monthSpend) }),
				previousSpend: formatMoney({ currency, money: asMoney(stats.previousMonthSpend) })
			})}
		</div>
	</div>

	{#if stats.currentTargetPercentage !== null}
		{@const clamped = clamp(stats.currentTargetPercentage, 0, 100)}
		<div class="relative col-span-2 rounded-md border border-success/40 p-2 text-center">
			<div class="absolute inset-0 bg-success/20" style="width: {clamped}%"></div>

			<div class="font-currency text-xl">
				{stats.currentTargetPercentage}%
			</div>
			<div class="text-sm">{m.category_stats_target_percentage()}</div>
		</div>
	{/if}
</div>
