<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { cn } from 'tailwind-variants';
	import PhCheckFat from '~icons/ph/check-fat';
	import PhSparkle from '~icons/ph/sparkle';
	import PhWarningOctagon from '~icons/ph/warning-octagon';

	let { unassigned }: { unassigned: number } = $props();

	const getBudget = getBudgetContext();
	const currency = $derived(getBudget().currency);
</script>

{#snippet label()}
	{#if unassigned === 0}
		<PhCheckFat class="size-6 text-muted" />
		{m.all_assigned_money_label()}
	{:else if unassigned > 0}
		<PhSparkle class="size-6 animate-pulse" />
		{m.unassigned_money_label()}
	{:else}
		<PhWarningOctagon class="text-destructive size-6 animate-pulse" />
		{m.negative_unassigned_money_label()}
	{/if}
{/snippet}

<div
	class={cn(
		'mt-auto flex flex-col gap-0.5 rounded-md p-2 shadow-xs',
		unassigned === 0
			? 'bg-muted/10 text-muted'
			: unassigned > 0
				? 'bg-info/10 text-info'
				: 'bg-error/10 text-error'
	)}
>
	<div class="flex items-center gap-2">
		{@render label()}
	</div>

	{#if unassigned !== 0}
		<div class="ml-auto text-xl font-semibold text-foreground tabular-nums">
			{formatCurrency({ centValue: unassigned, currency })}
		</div>
	{/if}
</div>
