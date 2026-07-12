<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { Button } from '$lib/components/ui/button';
	import { InputMoney } from '$lib/components/ui/input-money';
	import * as Popover from '$lib/components/ui/popover';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { UNASSIGNED } from '$lib/constants';
	import * as m from '$lib/paraglide/messages';
	import {
		getBudget,
		getMonthly,
		getUnassigned,
		transferAssignment
	} from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { Combobox } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import ArrowFatLineDownDuotoneIcon from '~icons/ph/arrow-fat-line-down-duotone';

	let {
		categoryName,
		month,
		otherCategories,
		remaining,
		rowId
	}: {
		categoryName: string;
		month: Month;
		otherCategories: { id: string; name: string; remaining: number }[];
		remaining: number;
		rowId: string;
	} = $props();

	const budgetId = getBudgetId();
	const budget = $derived(await getBudget(budgetId()));
	const unassigned = $derived(await getUnassigned({ budgetId: budgetId(), month }));
	const getOtherRemaining = $derived(
		(id: string) => otherCategories.find((f) => f.id === id)?.remaining ?? 0
	);

	const currency = $derived(budget.currency);
	const id = $props.id();
	const form = $derived(transferAssignment.for(id));

	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			'h-full w-full cursor-pointer p-1 text-right font-currency -outline-offset-2 hover:bg-surface hover:outline-2 hover:outline-interactive/60',
			'aria-disabled:text-muted aria-disabled:hover:bg-transparent aria-disabled:hover:outline-none'
		)}
		disabled={remaining === 0}
		aria-disabled={remaining === 0}
		aria-label={m.transfer_assignment_trigger_label({ name: categoryName })}
	>
		<div
			class={cn(
				'flex size-full items-center justify-end rounded-sm px-1',
				remaining > 0 && 'bg-success/10',
				remaining < 0 && 'bg-error/10 text-error'
			)}
		>
			{formatMoney({ currency, money: asMoney(remaining) })}
		</div>
	</Popover.Trigger>

	<Popover.Content align="end" sideOffset={1} class="rounded-xs p-3 shadow-lg">
		<form
			{...form.enhance(async (f) => {
				if (await f.submit().updates(getMonthly, getUnassigned)) {
					open = false;
				}
			})}
			class="flex flex-col gap-3"
		>
			<input {...form.fields.budgetId.as('hidden', budgetId())} />
			<input type="hidden" name={form.fields.month.as('number').name} value={month} />

			{#if remaining > 0}
				{@render moveform()}
			{:else}
				{@render coverform()}
			{/if}

			<div class="flex justify-end gap-2">
				<Button variant="ghost" size="sm" onclick={() => (open = false)}
					>{m.transfer_assignment_cancel()}</Button
				>
				<Button type="submit" size="sm">{m.transfer_assignment_ok()}</Button>
			</div>
		</form>
	</Popover.Content>
</Popover.Root>

{#snippet sharedFields()}
	<input {...form.fields.sourceCategoryId.as('hidden', rowId)} />
	<SelectCategory
		name={form.fields.targetCategoryId.as('select').name}
		bind:value={
			() => form.fields.targetCategoryId.value() ?? '', (v) => form.fields.targetCategoryId.set(v)
		}
		categories={otherCategories}
		nullable
		ariaInvalid={form.fields.targetCategoryId.issues()?.length ? true : undefined}
		textEmpty={m.transfer_assignment_unassigned()}
		ariaLabel={m.transfer_assignment_category()}
		ariaLabelTrigger={m.transfer_assignment_select_category()}
	>
		{#snippet customItemRow({ label, value: id })}
			{@render customSelectRow({
				balance: id === UNASSIGNED ? unassigned : getOtherRemaining(id),
				id,
				label
			})}
		{/snippet}
	</SelectCategory>
{/snippet}

{#snippet moveform()}
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between gap-4">
			<span class="font-medium">{m.transfer_assignment_move()}</span>
			<ArrowFatLineDownDuotoneIcon class="size-5 text-success" />
		</div>

		<InputMoney
			name={form.fields.amount.as('number').name}
			aria-label={m.transfer_assignment_amount()}
			bind:value={() => form.fields.amount.value(), (v) => form.fields.amount.set(v)}
			currency={budget.currency}
			class="px-2 text-right font-currency font-medium"
			selectOnFocus
		/>

		{@render sharedFields()}
	</div>
{/snippet}

{#snippet coverform()}
	<div class="flex items-center justify-between gap-4">
		<span class="font-medium">{m.transfer_assignment_cover()}</span>
		<ArrowFatLineDownDuotoneIcon class="size-5 rotate-180 text-error" />
	</div>

	<input {...form.fields.amount.as('hidden', remaining)} />

	{@render sharedFields()}
{/snippet}

{#snippet customSelectRow(item: { balance: number; id: string; label: string })}
	<Combobox.Item
		value={item.id}
		label={item.label}
		class="flex w-full cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-info/5 data-highlighted:text-info data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	>
		<div>{item.label}</div>
		<div
			class={cn(
				'rounded-sm p-0.5 px-2 text-xs font-currency text-foreground',
				item.balance > 0 && 'bg-success/20',
				item.balance < 0 && 'bg-error/20 text-error'
			)}
		>
			{formatMoney({ currency, money: asMoney(item.balance) })}
		</div>
	</Combobox.Item>
{/snippet}
