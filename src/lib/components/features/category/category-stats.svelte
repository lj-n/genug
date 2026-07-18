<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getCategoryById, getCategoryStats } from '$lib/remote-functions/category.remote';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { formatRelativeDate } from '$lib/utils/format-relative-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { formatMonth, type Month } from '$lib/utils/month';
	import { parseDate } from '@internationalized/date';

	import CategoryStatsMonthly from './category-stats-monthly.svelte';

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
</script>

<section
	class="flex h-fit flex-col content-start gap-2 rounded-md border border-muted/20 bg-background p-3 text-foreground/80 shadow-xs"
	aria-label={m.category_section_title_stats()}
>
	<h3 class="text-sm font-semibold">
		{formatMonth({ month, options: { month: 'long', year: 'numeric' } })}
	</h3>

	<CategoryStatsMonthly categoryId={category.id} {currency} {month} />

	<h3 class="mt-2 text-sm font-semibold">{m.category_stats_group_all_time()}</h3>

	<div class="grid grid-cols-2 gap-2">
		<div class="rounded-md border border-info/20 bg-info/10 p-2 text-center">
			<div class="text-xl font-bold tabular-nums">
				{formatMoney({ currency, money: asMoney(stats.totalRelatedTransactionSum) })}
			</div>
			<div class="text-sm">{m.category_stats_spent()}</div>
		</div>

		<div class="rounded-md border border-info/20 bg-info/10 p-2 text-center">
			<div class="text-xl font-bold tabular-nums">{stats.totalRelatedTransactionCount}</div>
			<div class="text-sm">{m.category_stats_transaction_count()}</div>
		</div>

		<div class="col-span-2 rounded-md border border-info/20 bg-info/10 p-2 text-center">
			<div class="text-xl font-bold">
				{stats.lastActivityDate === null
					? m.category_stats_last_activity_never()
					: formatRelativeDate({ date: parseDate(stats.lastActivityDate) })}
			</div>
			<div class="text-sm">{m.category_stats_last_activity()}</div>
		</div>
	</div>
</section>
