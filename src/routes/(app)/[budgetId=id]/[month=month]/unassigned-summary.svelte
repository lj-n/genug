<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getBudget, getUnassigned } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { cn } from 'tailwind-variants';
	import CheckFatDuoToneIcon from '~icons/ph/check-fat-duotone';
	import WarningOctagonBoldIcon from '~icons/ph/warning-octagon-bold';

	const budgetId = getBudgetId();

	const unassigned = $derived(await getUnassigned(budgetId()));

	const { currency } = $derived(await getBudget(budgetId()));
</script>

{#snippet label()}
	{#if unassigned === 0}
		<CheckFatDuoToneIcon />
		{m.all_assigned_money_label()}
	{:else if unassigned > 0}
		{m.unassigned_money_label()}
	{:else}
		<WarningOctagonBoldIcon />
		{m.negative_unassigned_money_label()}
	{/if}
{/snippet}

<div
	class={cn(
		'ml-auto flex h-9 items-center gap-2 rounded-lg px-3',
		unassigned === 0
			? 'bg-muted/10 text-muted'
			: unassigned > 0
				? 'border border-info/15 bg-info/10 text-info shadow-xs shadow-info/15'
				: 'border border-error/60 bg-error/10 text-error'
	)}
>
	{@render label()}

	{#if unassigned !== 0}
		<div class="font-semibold text-foreground tabular-nums">
			{formatCurrency({ centValue: unassigned, currency })}
		</div>
	{/if}
</div>
