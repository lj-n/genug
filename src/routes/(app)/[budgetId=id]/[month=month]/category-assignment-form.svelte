<script lang="ts">
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { assignBudget, getBudget } from '$lib/remote-functions/budget.remote';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { Popover } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	type Category = {
		budgetId: string;
		id: string;
		thisMonthAmount: number;
	};

	let {
		budgetId,
		category,
		month,
		open = $bindable(false)
	}: {
		budgetId: string;
		category: Category;
		month: string;
		open?: boolean;
	} = $props();

	const { currency } = $derived(await getBudget({ budgetId }));

	const scopedForm = $derived(assignBudget.for(category.id));

	$effect(() => {
		if (open) {
			scopedForm.fields.amount.set(category.thisMonthAmount);
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class={cn(
			'h-full w-full cursor-pointer p-2 text-right font-currency -outline-offset-2 hover:bg-interactive/15 hover:outline-2 hover:outline-interactive/40',
			open && 'hidden'
		)}
	>
		{formatCurrency({ centValue: category.thisMonthAmount, currency })}
	</Popover.Trigger>

	<Popover.ContentStatic class="absolute inset-0 outline-2 -outline-offset-2 outline-focus">
		<form
			{...scopedForm.enhance(async (form) => {
				if (await form.submit()) {
					open = false;
				}
			})}
			class="contents"
		>
			<input {...scopedForm.fields.budgetId.as('hidden', budgetId)} />
			<input {...scopedForm.fields.categoryId.as('hidden', category.id)} />
			<input
				type="hidden"
				name={scopedForm.fields.month.as('number').name}
				value={parseInt(month)}
			/>

			<div class="h-full w-full">
				<InputCurrency
					name={scopedForm.fields.amount.as('number').name}
					bind:value={
						() => scopedForm.fields.amount.value() ?? category.thisMonthAmount,
						(v) => scopedForm.fields.amount.set(v)
					}
					{currency}
					class="h-full w-full rounded-none px-2 text-right font-currency ring-0 outline-none"
					selectOnFocus
				/>
			</div>

			<input type="submit" value="" class="hidden" />
		</form>
	</Popover.ContentStatic>
</Popover.Root>
