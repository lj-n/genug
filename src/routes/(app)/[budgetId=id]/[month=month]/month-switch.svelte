<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Popover from '$lib/components/ui/popover';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { createMonthParam } from '$lib/utils/date-utils';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { CalendarDate, getLocalTimeZone, isSameMonth, today } from '@internationalized/date';
	import PhArrowFatLeftDuoTone from '~icons/ph/arrow-fat-left-duotone';
	import PhArrowFatRightDuoTone from '~icons/ph/arrow-fat-right-duotone';
	import PhCaretLeft from '~icons/ph/caret-left';
	import PhCaretRight from '~icons/ph/caret-right';

	let { paramsDate }: { paramsDate: CalendarDate } = $props();

	const currentDate = today(getLocalTimeZone());
	const { formatDate } = getIntlContext();

	let value = $derived(paramsDate);

	let allMonthsThisYear = $derived.by(() =>
		Array.from({ length: 12 }, (_, i) => value.set({ month: i + 1 }))
	);

	let isCurrentMonth = $derived.by(() => isSameMonth(value, currentDate));

	function goToSelectedMonth(date: CalendarDate) {
		goto(
			resolve('/(app)/[budgetId=id]/[month=month]', {
				budgetId: page.params.budgetId!,
				month: createMonthParam(date.toDate(getLocalTimeZone())).toString()
			})
		);
	}
</script>

<div>
	<ButtonGroup.Root>
		<Button
			aria-label={m.budget_select_previous_month()}
			size="icon"
			onclick={() => {
				value = value.subtract({ months: 1 });
				goToSelectedMonth(value);
			}}
		>
			<PhArrowFatLeftDuoTone />
		</Button>

		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} class="min-w-26 text-xl font-bold text-foreground">
						{formatDate(value, {
							month: 'short',
							year: '2-digit'
						})}
					</Button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content align="center" class="w-50 gap-1 rounded-xl p-0 text-sm">
				<ButtonGroup.Root class="w-full px-1 pt-1">
					<Button
						class="grow"
						variant="ghost"
						size="icon"
						aria-label={m.budget_select_previous_year()}
						onclick={() => {
							value = value.subtract({ years: 1 });
							goToSelectedMonth(value);
						}}
					>
						<PhCaretLeft />
					</Button>

					<ButtonGroup.Text>{formatDate(value, { year: 'numeric' })}</ButtonGroup.Text>

					<Button
						class="grow"
						variant="ghost"
						size="icon"
						aria-label={m.budget_select_next_year()}
						onclick={() => {
							value = value.add({ years: 1 });
							goToSelectedMonth(value);
						}}
					>
						<PhCaretRight />
					</Button>
				</ButtonGroup.Root>

				<Separator />

				<div class="grid grid-cols-3 gap-1 px-1 pb-1">
					{#each allMonthsThisYear as month (month.toString())}
						<Button
							variant="ghost"
							onclick={() => {
								value = month;
								goToSelectedMonth(value);
							}}
						>
							{formatDate(month, { month: 'short' })}
						</Button>
					{/each}

					{#if !isCurrentMonth}
						<Button
							variant="ghost"
							class="col-span-3 w-full"
							onclick={() => {
								value = currentDate;
								goToSelectedMonth(value);
							}}
						>
							{m.budget_go_to_current_month()}
						</Button>
					{/if}
				</div>
			</Popover.Content>
		</Popover.Root>

		<Button
			aria-label={m.budget_select_next_month()}
			size="icon"
			onclick={() => {
				value = value.add({ months: 1 });
				goToSelectedMonth(value);
			}}
		>
			<PhArrowFatRightDuoTone />
		</Button>
	</ButtonGroup.Root>
</div>
