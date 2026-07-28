<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getCategoryById, getCategoryStats } from '$lib/remote-functions/category.remote';
	import { clamp } from '$lib/utils/clamp';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { formatRelativeDate } from '$lib/utils/format-relative-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { addMonths, formatMonth, type Month } from '$lib/utils/month';
	import { parseDate } from '@internationalized/date';

	let {
		category,
		currency,
		month
	}: {
		category: Awaited<ReturnType<typeof getCategoryById>>;
		currency: (typeof CURRENCIES)[number];
		month: Month;
	} = $props();

	const stats = $derived(await getCategoryStats({ categoryId: category.id, month }));

	// The floor of 1 avoids dividing by zero when every month is empty.
	const maxSpend = $derived(Math.max(...stats.sparkline.map((b) => b.spend), 1));

	const rowChrome = 'rounded px-2 py-1.5 even:bg-muted/3';
</script>

{#snippet moneyRow(label: string, value: string)}
	<div class="{rowChrome} flex items-baseline justify-between">
		<dt class="text-sm text-muted">{label}</dt>
		<dd class="font-currency">{value}</dd>
	</div>
{/snippet}

<section class="flex flex-col gap-2" aria-label={m.category_section_title_stats()}>
	<h2 class="font-semibold">{m.category_section_title_stats()}</h2>

	<figure class="flex flex-col gap-1">
		<svg
			viewBox="0 0 118 40"
			preserveAspectRatio="none"
			role="img"
			aria-label={m.category_stats_sparkline_label()}
			class="h-16 w-full"
		>
			{#each stats.sparkline as bucket, i (bucket.month)}
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
		<figcaption class="text-xs text-muted">{m.category_stats_sparkline_label()}</figcaption>
	</figure>

	<h3 class="text-xs font-medium tracking-wide text-muted uppercase">
		{formatMonth({ month, options: { month: 'long', year: 'numeric' } })}
	</h3>

	<dl class="flex flex-col">
		{@render moneyRow(
			m.category_stats_average(),
			stats.trailingAverageSpend === null
				? '—'
				: formatMoney({ currency, money: asMoney(stats.trailingAverageSpend) })
		)}

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

		{#if stats.currentTargetPercentage !== null}
			{@const clamped = clamp(stats.currentTargetPercentage, 0, 100)}
			<div class="{rowChrome} flex items-center justify-between">
				<dt class="text-sm text-muted">{m.category_stats_target_percentage()}</dt>
				<dd class="flex items-center gap-2">
					<div class="h-1.5 w-20 overflow-hidden rounded-full bg-muted/20">
						<div class="h-full bg-success" style="width: {clamped}%"></div>
					</div>
					<span class="font-currency text-sm">{stats.currentTargetPercentage}%</span>
				</dd>
			</div>
		{/if}
	</dl>

	<h3 class="mt-2 text-xs font-medium tracking-wide text-muted uppercase">
		{m.category_stats_group_all_time()}
	</h3>

	<dl class="flex flex-col">
		{@render moneyRow(
			m.category_stats_spent(),
			formatMoney({ currency, money: asMoney(stats.totalRelatedTransactionSum) })
		)}
		{@render moneyRow(
			m.category_stats_transaction_count(),
			String(stats.totalRelatedTransactionCount)
		)}
		<div class="{rowChrome} flex items-baseline justify-between">
			<dt class="text-sm text-muted">{m.category_stats_last_activity()}</dt>
			<dd class="text-sm">
				{stats.lastActivityDate === null
					? m.category_stats_last_activity_never()
					: formatRelativeDate({ date: parseDate(stats.lastActivityDate) })}
			</dd>
		</div>
	</dl>
</section>
