<script lang="ts">
	import { resolve } from '$app/paths';
	import { focusRing } from '$lib/components/ui/focus-ring';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getBudget, getUnassigned } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { formatMonth, type Month, toParam } from '$lib/utils/month';
	import { cn } from 'tailwind-variants';
	import CheckFatDuoToneIcon from '~icons/ph/check-fat-duotone';
	import WarningOctagonBoldIcon from '~icons/ph/warning-octagon-bold';

	let { month }: { month: Month } = $props();

	const budgetId = getBudgetId();

	const breakdown = $derived(await getUnassigned({ budgetId: budgetId(), month }));
	const unassigned = $derived(breakdown.unassigned);

	const { currency } = $derived(await getBudget(budgetId()));

	let open = $state(false);

	const monthLabel = $derived(formatMonth({ month, options: { month: 'long', year: 'numeric' } }));

	const prose = $derived.by(() => {
		if (unassigned < 0 && breakdown.position < 0) {
			return m.unassigned_breakdown_prose_negative_position();
		}
		if (unassigned < 0 && breakdown.bottleneck !== null) {
			return m.unassigned_breakdown_prose_negative_reserved({
				month: formatMonth({
					month: breakdown.bottleneck,
					options: { month: 'long', year: 'numeric' }
				})
			});
		}
		return m.unassigned_breakdown_prose_positive();
	});

	// `|| 0` normalizes the negative zero produced by negating a zero row.
	function signedMoney(cents: number): string {
		return formatMoney({
			currency,
			money: asMoney(cents || 0),
			options: { signDisplay: 'always' }
		});
	}
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

{#snippet row(term: string, amount: string)}
	<div class="flex items-baseline justify-between gap-6">
		<dt>{term}</dt>
		<dd class="font-currency tabular-nums">{amount}</dd>
	</div>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			'ml-auto flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 hover:outline-1 hover:-outline-offset-1 hover:outline-foreground/50 @3xl/main:h-7 @3xl/main:w-auto @3xl/main:justify-start',
			focusRing,
			unassigned === 0
				? 'bg-muted/10 text-muted'
				: unassigned > 0
					? 'bg-info/10 text-info'
					: 'bg-error/10 text-error'
		)}
		aria-label={m.unassigned_breakdown_trigger_label()}
	>
		<!-- The label is wrapped so the mobile band's justify-between sees exactly
		     two flex items: label left, amount right. -->
		<span class="flex items-center gap-2">
			{@render label()}
		</span>

		{#if unassigned !== 0}
			<div class="font-semibold text-foreground tabular-nums">
				{formatMoney({ currency, money: asMoney(unassigned) })}
			</div>
		{/if}
	</Popover.Trigger>

	<!-- Cap to the floating-UI available width so the breakdown never forces
	     page-level horizontal overflow on phones. -->
	<Popover.Content
		align="end"
		sideOffset={4}
		class="w-fit max-w-[min(24rem,var(--bits-popover-content-available-width))] min-w-64 gap-3"
	>
		<dl class="flex flex-col gap-1">
			{@render row(
				m.unassigned_breakdown_income({ month: monthLabel }),
				signedMoney(breakdown.incomeUntilMonth)
			)}
			{@render row(
				m.unassigned_breakdown_assigned({ month: monthLabel }),
				signedMoney(-breakdown.assignedUntilMonth)
			)}

			{#if breakdown.reserved !== 0 && breakdown.bottleneck !== null}
				{@render row(m.unassigned_breakdown_position(), signedMoney(breakdown.position))}

				<div class="flex items-baseline justify-between gap-6">
					<dt>
						{m.unassigned_breakdown_reserved()}
						(<a
							class={cn('rounded-xs text-info underline hover:no-underline', focusRing)}
							href={resolve('/(app)/[budgetId=id]/[month=month]', {
								budgetId: budgetId(),
								month: toParam(breakdown.bottleneck)
							})}
							aria-label={m.unassigned_breakdown_bottleneck_link_label({
								month: formatMonth({
									month: breakdown.bottleneck,
									options: { month: 'long', year: 'numeric' }
								})
							})}
							onclick={() => (open = false)}
							>{m.unassigned_breakdown_bottleneck({
								month: formatMonth({
									month: breakdown.bottleneck,
									options: { month: 'short', year: '2-digit' }
								})
							})}</a
						>)
					</dt>
					<dd class="font-currency tabular-nums">{signedMoney(-breakdown.reserved)}</dd>
				</div>
			{/if}

			<div
				class="flex items-baseline justify-between gap-6 border-t border-foreground/10 pt-1 font-semibold"
			>
				<dt>{m.unassigned_breakdown_total()}</dt>
				<dd class="font-currency tabular-nums">
					{formatMoney({ currency, money: asMoney(unassigned) })}
				</dd>
			</div>
		</dl>

		<p class="text-muted">{prose}</p>
	</Popover.Content>
</Popover.Root>
