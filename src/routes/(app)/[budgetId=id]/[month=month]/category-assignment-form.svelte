<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { InputMoney } from '$lib/components/ui/input-money';
	import { PopoverForm } from '$lib/components/ui/popover-form';
	import { m } from '$lib/paraglide/messages';
	import { assignment, getMonthly, getUnassigned } from '$lib/remote-functions/budget.remote';
	import { CURRENCIES } from '$lib/utils/currencies';
	import { asMoney, formatMoney } from '$lib/utils/money';
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

<!-- Hot path (see CONTEXT.md): no pending chrome — no disabled input or loading
button during flight; the optimistic-override feedback model stays untouched. -->
<PopoverForm
	form={scopedForm}
	bind:open
	contentStatic
	contentClass="absolute inset-0 outline-2 -outline-offset-2 outline-focus"
	formClass="contents"
	updates={() => [getMonthly, getUnassigned]}
>
	{#snippet trigger(props)}
		<button
			{...props}
			class={cn(
				'h-full w-full cursor-pointer p-2 text-right font-currency -outline-offset-2 hover:bg-surface hover:outline-2 hover:outline-interactive/60',
				open && 'hidden'
			)}
			aria-label={m.budget_monthly_table_header_amount()}
		>
			{formatMoney({ currency, money: asMoney(category.assigned) })}
		</button>
	{/snippet}

	{#snippet fields()}
		<input {...scopedForm.fields.budgetId.as('hidden', category.budgetId)} />
		<input {...scopedForm.fields.categoryId.as('hidden', category.id)} />
		<input type="hidden" name={scopedForm.fields.month.as('number').name} value={month} />

		<div class="h-full w-full">
			<InputMoney
				name={scopedForm.fields.amount.as('number').name}
				bind:value={() => scopedForm.fields.amount.value(), (v) => scopedForm.fields.amount.set(v)}
				{currency}
				aria-invalid={scopedForm.fields.amount.issues()?.length ? true : undefined}
				class="h-full w-full rounded-none px-2 text-right font-currency ring-0 outline-none"
				aria-label={m.budget_monthly_table_header_amount()}
				selectOnFocus
			/>
		</div>

		<input type="submit" value="" class="hidden" />
	{/snippet}

	{#snippet errors(error)}
		<p
			class="absolute inset-x-0 top-full z-10 bg-surface-high p-1 text-right text-xs text-error shadow-md"
			role="alert"
		>
			{error.message}
		</p>
	{/snippet}
</PopoverForm>
