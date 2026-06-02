<script lang="ts">
	import type { Snippet } from 'svelte';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Popover from '$lib/components/ui/popover';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { createMonthParam } from '$lib/utils/date-utils';
	import { formatDate } from '$lib/utils/format-date';
	import { CalendarDate, getLocalTimeZone, isSameMonth, today } from '@internationalized/date';
	import PhArrowFatLeftDuoTone from '~icons/ph/arrow-fat-left-duotone';
	import PhArrowFatRightDuoTone from '~icons/ph/arrow-fat-right-duotone';
	import PhCaretLeft from '~icons/ph/caret-left';
	import PhCaretRight from '~icons/ph/caret-right';

	let { paramsDate }: { paramsDate: CalendarDate } = $props();

	const currentDate = today(getLocalTimeZone());

	let selectedMonth = $derived(paramsDate);

	let monthsInSelectedYear = $derived.by(() =>
		Array.from({ length: 12 }, (_, i) => selectedMonth.set({ month: i + 1 }))
	);

	let isCurrentMonth = $derived.by(() => isSameMonth(selectedMonth, currentDate));

	function getMonthParam(date: CalendarDate) {
		return createMonthParam(date.toDate(getLocalTimeZone())).toString();
	}

	function navigateToMonth(date: CalendarDate) {
		selectedMonth = date;
		goto(
			resolve('/(app)/[budgetId=id]/[month=month]', {
				budgetId: page.params.budgetId!,
				month: getMonthParam(date)
			}),
			{ keepFocus: true }
		);
	}

	function shiftMonth(delta: { months?: number; years?: number }) {
		navigateToMonth(selectedMonth.add(delta));
	}
</script>

<div>
	{#snippet monthStepButton(ariaLabel: string, icon: Snippet, onClick: () => void)}
		<Button aria-label={ariaLabel} size="icon" onclick={onClick}>
			{@render icon()}
		</Button>
	{/snippet}

	{#snippet yearStepButton(ariaLabel: string, icon: Snippet, onClick: () => void)}
		<Button class="grow" variant="ghost" size="icon" aria-label={ariaLabel} onclick={onClick}>
			{@render icon()}
		</Button>
	{/snippet}

	{#snippet previousMonthIcon()}
		<PhArrowFatLeftDuoTone />
	{/snippet}

	{#snippet nextMonthIcon()}
		<PhArrowFatRightDuoTone />
	{/snippet}

	{#snippet previousYearIcon()}
		<PhCaretLeft />
	{/snippet}

	{#snippet nextYearIcon()}
		<PhCaretRight />
	{/snippet}

	<ButtonGroup.Root>
		{@render monthStepButton(m.budget_select_previous_month(), previousMonthIcon, () =>
			shiftMonth({ months: -1 })
		)}

		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} class="min-w-26 font-bold text-foreground">
						{formatDate({ date: selectedMonth, options: { month: 'short', year: '2-digit' } })}
					</Button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content align="center" class="w-50 gap-1 rounded-xl p-0 text-sm">
				<ButtonGroup.Root class="w-full px-1 pt-1">
					{@render yearStepButton(m.budget_select_previous_year(), previousYearIcon, () =>
						shiftMonth({ years: -1 })
					)}

					<ButtonGroup.Text
						>{formatDate({ date: selectedMonth, options: { year: 'numeric' } })}</ButtonGroup.Text
					>

					{@render yearStepButton(m.budget_select_next_year(), nextYearIcon, () =>
						shiftMonth({ years: 1 })
					)}
				</ButtonGroup.Root>

				<Separator />

				<div class="grid grid-cols-3 gap-1 px-1 pb-1">
					{#each monthsInSelectedYear as month (month.toString())}
						<Button
							class={isSameMonth(month, selectedMonth) ? 'bg-info/5 text-info' : undefined}
							variant="ghost"
							onclick={() => navigateToMonth(month)}
						>
							{formatDate({ date: month, options: { month: 'short' } })}
						</Button>
					{/each}

					{#if !isCurrentMonth}
						<Button
							variant="ghost"
							class="col-span-3 w-full"
							onclick={() => navigateToMonth(currentDate)}
						>
							{m.budget_go_to_current_month()}
						</Button>
					{/if}
				</div>
			</Popover.Content>
		</Popover.Root>

		{@render monthStepButton(m.budget_select_next_month(), nextMonthIcon, () =>
			shiftMonth({ months: 1 })
		)}
	</ButtonGroup.Root>
</div>
