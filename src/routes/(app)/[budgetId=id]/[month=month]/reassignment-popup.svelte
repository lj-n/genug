<!-- Desktop transfer surface for a category's Remaining cell. The panel
     overlaps the cell exactly (see category-popover) and its header mirrors
     the cell so the amount stays put when it opens. -->
<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { Button } from '$lib/components/ui/button';
	import { hoverOutline } from '$lib/components/ui/focus-ring';
	import { InputMoney } from '$lib/components/ui/input-money';
	import * as Popover from '$lib/components/ui/popover';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { UNASSIGNED } from '$lib/constants';
	import * as m from '$lib/paraglide/messages';
	import {
		getBudget,
		getMonthly,
		getUnassigned,
		reassignment
	} from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
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
	const unassignedBreakdown = $derived(await getUnassigned({ budgetId: budgetId(), month }));
	const unassigned = $derived(unassignedBreakdown.unassigned);
	const getOtherRemaining = $derived(
		(id: string) => otherCategories.find((f) => f.id === id)?.remaining ?? 0
	);

	const currency = $derived(budget.currency);
	const id = $props.id();
	const form = $derived(reassignment.for(id));

	let open = $state(false);

	const submit = createFormSubmit(() => form, {
		onSuccess: () => {
			open = false;
		},
		updates: () => [getMonthly, getUnassigned]
	});

	// Clear any thrown error when the popover closes so it never flashes on reopen.
	$effect(() => {
		if (!open) submit.reset();
	});

	// Cell height measured live — it both offsets the panel over the cell and
	// sizes the header strip (see category-popover).
	let triggerEl = $state<HTMLElement | null>(null);
	let cellHeight = $state(0);
	$effect(() => {
		if (!triggerEl) return;
		const observer = new ResizeObserver(() => (cellHeight = triggerEl!.offsetHeight));
		observer.observe(triggerEl);
		return () => observer.disconnect();
	});

	const isMove = $derived(remaining > 0);
</script>

<Popover.Root bind:open>
	<!-- The closed cell IS the trigger; it mirrors the header's amount slot so the
	     value doesn't jump when the panel opens over it. -->
	<Popover.Trigger
		bind:ref={triggerEl}
		disabled={remaining === 0}
		aria-disabled={remaining === 0}
		aria-label={m.reassignment_trigger_label({ name: categoryName })}
		class={cn(
			'flex size-full cursor-pointer items-center justify-end px-2 text-right font-currency font-medium hover:z-10 hover:bg-surface focus-visible:z-10',
			hoverOutline,
			remaining < 0 && 'text-error',
			remaining === 0 &&
				'cursor-default font-normal text-muted hover:bg-transparent hover:outline-none'
		)}
	>
		{formatMoney({ currency, money: asMoney(remaining) })}
	</Popover.Trigger>

	<!-- ring (box-shadow), not border: a border-box border would shrink the
	     content box and shift the header 1px off the cell on open. -->
	<Popover.Content
		side="bottom"
		align="end"
		sideOffset={-cellHeight}
		motion="fade"
		class="w-80 gap-0 overflow-hidden rounded-xs bg-surface p-0 shadow-sm ring-1 ring-muted/30"
	>
		<div
			class="flex items-center justify-between gap-2 border-b border-muted/20 bg-muted/5 px-2"
			style="min-height: {cellHeight}px"
		>
			<span class="flex items-center gap-1.5 text-sm font-medium">
				<ArrowFatLineDownDuotoneIcon
					class={cn('size-4', isMove ? 'text-success' : 'rotate-180 text-error')}
				/>
				{isMove ? m.reassignment_move() : m.reassignment_cover()}
			</span>

			<!-- The popover base is text-sm, but the cell renders font-currency in a
			     text-base (16px) context, so its 0.9375em lands at 15px. Restore that
			     em-context so the amount matches the cell exactly. -->
			<span class="text-base leading-6">
				<span class={cn('font-currency font-medium', remaining < 0 && 'text-error')}>
					{formatMoney({ currency, money: asMoney(remaining) })}
				</span>
			</span>
		</div>

		<!-- The panel portals to <body>, outside @container/main — touch density
		     keys on pointer-coarse instead of the band. -->
		<form {...submit.attrs} class="flex flex-col gap-3 p-3">
			<input {...form.fields.budgetId.as('hidden', budgetId())} />
			<input type="hidden" name={form.fields.month.as('number').name} value={month} />
			<input {...form.fields.sourceCategoryId.as('hidden', rowId)} />

			{#if isMove}
				<InputMoney
					name={form.fields.amount.as('number').name}
					aria-label={m.reassignment_amount()}
					bind:value={() => form.fields.amount.value(), (v) => form.fields.amount.set(v)}
					currency={budget.currency}
					class="px-2 text-right font-currency pointer-coarse:h-11"
					selectOnFocus
				/>
			{:else}
				<input {...form.fields.amount.as('hidden', remaining)} />
			{/if}

			<SelectCategory
				class="pointer-coarse:h-11"
				name={form.fields.targetCategoryId.as('select').name}
				bind:value={
					() => form.fields.targetCategoryId.value() ?? '',
					(v) => form.fields.targetCategoryId.set(v)
				}
				categories={otherCategories}
				nullable
				ariaInvalid={form.fields.targetCategoryId.issues()?.length ? true : undefined}
				textEmpty={m.reassignment_unassigned()}
				ariaLabel={m.reassignment_category()}
				ariaLabelTrigger={m.reassignment_select_category()}
			>
				{#snippet customItemRow({ label, value: id })}
					{@render customSelectRow({
						balance: id === UNASSIGNED ? unassigned : getOtherRemaining(id),
						id,
						label
					})}
				{/snippet}
			</SelectCategory>

			{#if submit.error}
				<p class="text-sm text-error" role="alert">{submit.error.message}</p>
			{/if}

			<div class="flex justify-end gap-2">
				<Button
					variant="ghost"
					size="sm"
					class="pointer-coarse:h-11"
					onclick={() => (open = false)}
				>
					{m.reassignment_cancel()}
				</Button>
				<Button
					type="submit"
					size="sm"
					class="pointer-coarse:h-11 pointer-coarse:px-4"
					loading={submit.pending}
				>
					{m.reassignment_ok()}
				</Button>
			</div>
		</form>
	</Popover.Content>
</Popover.Root>

{#snippet customSelectRow(item: { balance: number; id: string; label: string })}
	<Combobox.Item
		value={item.id}
		label={item.label}
		class="flex w-full cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-muted/10 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	>
		<div>{item.label}</div>
		<div
			class={cn(
				'rounded-sm p-0.5 px-2 font-currency text-xs text-foreground',
				item.balance < 0 && 'bg-error/20 text-error'
			)}
		>
			{formatMoney({ currency, money: asMoney(item.balance) })}
		</div>
	</Combobox.Item>
{/snippet}
