<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import * as Popover from '$lib/components/ui/popover';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getBudget, transferAssignment } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { cn } from 'tailwind-variants';
	import ArrowFatLineDownDuotoneIcon from '~icons/ph/arrow-fat-line-down-duotone';

	let { remaining }: { remaining: number } = $props();

	const budgetId = getBudgetId();
	const budget = $derived(await getBudget(budgetId()));
	const categories = $derived(await getCategories({ budgetId: budgetId() }));
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
	>
		<div
			class={cn(
				'flex size-full items-center justify-end rounded-sm px-1',
				remaining > 0 && 'bg-success/10',
				remaining < 0 && 'bg-error/10 text-error'
			)}
		>
			{formatCurrency({ centValue: remaining, currency })}
		</div>
	</Popover.Trigger>

	<Popover.Content align="end" sideOffset={1} class="rounded-xs p-3 shadow-lg">
		<form {...form} class="flex flex-col gap-3">
			{#if remaining > 0}
				{@render moveform()}
			{:else}
				{@render coverform()}
			{/if}
		</form>
	</Popover.Content>
</Popover.Root>

{#snippet moveform()}
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between gap-4">
			<span class="font-medium">Verschieben</span>
			<ArrowFatLineDownDuotoneIcon class="size-5 text-success" />
		</div>

		<InputCurrency
			name={form.fields.amount.as('number').name}
			aria-label="Amount"
			bind:value={() => form.fields.amount.value() ?? 0, (v) => form.fields.amount.set(v)}
			currency={budget.currency}
			class="px-2 text-right font-currency font-medium"
		/>

		<SelectCategory
			name={form.fields.targetCategoryId.as('select').name}
			bind:value={
				() => form.fields.targetCategoryId.value() ?? '', (v) => form.fields.targetCategoryId.set(v)
			}
			{categories}
			nullable
			ariaLabel={m.transactions_table_header_category()}
			ariaLabelTrigger={m.select_category_open()}
		/>
	</div>

	<div class="flex justify-end gap-2">
		<Button variant="ghost" size="sm">Cancel</Button>
		<Button size="sm">OK</Button>
	</div>
{/snippet}

{#snippet coverform()}
	<div class="flex items-center justify-between gap-4">
		<span class="font-medium">Ausgleichen</span>
		<ArrowFatLineDownDuotoneIcon class="size-5 rotate-180 text-error" />
	</div>

	<SelectCategory
		name={form.fields.targetCategoryId.as('select').name}
		bind:value={
			() => form.fields.targetCategoryId.value() ?? '', (v) => form.fields.targetCategoryId.set(v)
		}
		{categories}
		nullable
		ariaLabel={m.transactions_table_header_category()}
		ariaLabelTrigger={m.select_category_open()}
	/>

	<div class="flex justify-end gap-2">
		<Button variant="ghost" size="sm">Cancel</Button>
		<Button size="sm">OK</Button>
	</div>
{/snippet}
