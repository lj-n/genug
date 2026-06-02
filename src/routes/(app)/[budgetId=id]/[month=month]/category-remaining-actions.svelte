<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { cn } from 'tailwind-variants';
	import PhScales from '~icons/ph/scales';

	import type { PageData } from './$types';

	type Category = PageData['categories'][number];

	let {
		category,
		month
	}: {
		category: Category;
		month: PageData['month'];
	} = $props();

	const getBudget = getBudgetContext();
	const currency = $derived(getBudget().currency);

	let formEl: HTMLFormElement;
	const coverAmount = $derived(category.thisMonthAmount - category.thisMonthRemaining);
</script>

{#if category.thisMonthRemaining < 0}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					class="w-fit cursor-pointer rounded-full border border-error/50 bg-error/20 px-2 font-currency hover:bg-error/30"
					title={m.budget_monthly_action_cover_overspend_label()}
				>
					{formatCurrency({ centValue: category.thisMonthRemaining, currency })}
				</button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="end" class="w-fit">
			<DropdownMenu.Group>
				<DropdownMenu.Item variant="interactive" onSelect={() => formEl.requestSubmit()}>
					<PhScales />
					{m.budget_monthly_action_cover_overspend()}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<span
		class={cn(
			'w-fit rounded-full border border-muted/20 bg-muted/10 px-2 font-currency',
			category.thisMonthRemaining > 0 && 'border-success/80 bg-success/20'
		)}
	>
		{formatCurrency({ centValue: category.thisMonthRemaining, currency })}
	</span>
{/if}

<form
	bind:this={formEl}
	action={resolve('/(app)/[budgetId=id]/[month=month]?/assignment', {
		budgetId: category.budgetId,
		month
	})}
	method="POST"
	use:enhance
	class="hidden"
>
	<input type="hidden" name="categoryId" value={category.id} />
	<input type="hidden" name="amount" value={coverAmount} />
</form>
