<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { m } from '$lib/paraglide/messages';
	import { assignment, getMonthly, getUnassigned } from '$lib/remote-functions/budget.remote';
	import { CURRENCIES } from '$lib/utils/currencies';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { Popover } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	type Category = {
		assigned: number;
		budgetId: string;
		id: string;
	};

	let {
		category,
		currency,
		month,
		open = $bindable(false)
	}: {
		category: Category;
		currency: (typeof CURRENCIES)[number];
		month: Month;
		open?: boolean;
	} = $props();

	const scopedForm = $derived(assignment.for(category.id));

	$effect(() => {
		if (open) {
			scopedForm.fields.amount.set(category.assigned);
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			'h-full w-full cursor-pointer p-2 text-right font-currency -outline-offset-2 hover:bg-interactive/15 hover:outline-2 hover:outline-interactive/40',
			open && 'hidden'
		)}
		aria-label={m.budget_monthly_table_header_amount()}
	>
		{formatCurrency({ centValue: category.assigned, currency })}
	</Popover.Trigger>

	<Popover.ContentStatic class="absolute inset-0 outline-2 -outline-offset-2 outline-focus">
		<form
			{...scopedForm.enhance(async (form) => {
				if (await form.submit().updates(getMonthly, getUnassigned)) {
					open = false;
				}
			})}
			class="contents"
		>
			<input {...scopedForm.fields.budgetId.as('hidden', category.budgetId)} />
			<input {...scopedForm.fields.categoryId.as('hidden', category.id)} />
			<input type="hidden" name={scopedForm.fields.month.as('number').name} value={month} />

			<div class="h-full w-full">
				<InputCurrency
					name={scopedForm.fields.amount.as('number').name}
					bind:value={
						() => scopedForm.fields.amount.value() ?? category.assigned,
						(v) => scopedForm.fields.amount.set(v)
					}
					{currency}
					class="h-full w-full rounded-none px-2 text-right font-currency ring-0 outline-none"
					aria-label={m.budget_monthly_table_header_amount()}
					selectOnFocus
				/>
			</div>

			<input type="submit" value="" class="hidden" />
		</form>
	</Popover.ContentStatic>
</Popover.Root>
