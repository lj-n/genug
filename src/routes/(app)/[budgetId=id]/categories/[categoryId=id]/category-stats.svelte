<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategoryById, getCategoryStats } from '$lib/remote-functions/category.remote';
	import { clamp } from '$lib/utils/clamp';
	import { asMoney, formatMoney } from '$lib/utils/money';

	let { categoryId }: { categoryId: string } = $props();

	const cat = $derived(await getCategoryById({ categoryId }));
	const stats = $derived(await getCategoryStats({ categoryId }));
	const budget = $derived(await getBudget(cat.budgetId));
	const currency = $derived(budget.currency);
</script>

<section
	class="grid h-fit grid-cols-2 gap-2 text-foreground/80"
	aria-label={m.category_section_title_stats()}
>
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

	{#if stats.currentTargetPercentage !== null}
		{@const clamped = clamp(stats.currentTargetPercentage, 0, 100)}
		<div class="relative col-span-2 rounded-md border border-success/40 p-2 text-center">
			<div class="absolute inset-0 bg-success/20" style="width: {clamped}%"></div>

			<div class="text-xl font-bold tabular-nums">
				{stats.currentTargetPercentage}%
			</div>
			<div class="text-sm">{m.category_stats_target_percentage()}</div>
		</div>
	{/if}
</section>
