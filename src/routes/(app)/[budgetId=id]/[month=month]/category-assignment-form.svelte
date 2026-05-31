<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Form from '$lib/components/ui/form';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { Popover } from 'bits-ui';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { cn } from 'tailwind-variants';

	import type { PageData } from './$types';
	import type { schemaMonthlyAssigment } from './schema';

	let {
		category,
		form: assignmentForm,
		month,
		open = $bindable(false)
	}: {
		category: PageData['categories'][number];
		form: SuperValidated<Infer<typeof schemaMonthlyAssigment>>;
		month: PageData['month'];
		open?: boolean;
	} = $props();

	const { formatCurrency, locale, numberFormatOptions } = getIntlContext();

	const form = superForm(
		untrack(() => assignmentForm),
		{
			onUpdated(event) {
				if (event.form.message?.type === 'success') {
					open = false;
				}
			},
			warnings: { duplicateId: false }
		}
	);

	const { enhance, form: formData } = form;

	$effect(() => {
		if (open) {
			$formData = {
				amount: category.thisMonthAmount,
				categoryId: category.id
			};
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
		{formatCurrency(category.thisMonthAmount)}
	</Popover.Trigger>

	<Popover.ContentStatic class="absolute inset-0 outline-2 -outline-offset-2 outline-focus">
		<form
			action={resolve('/(app)/[budgetId=id]/[month=month]?/assignment', {
				budgetId: category.budgetId,
				month
			})}
			method="POST"
			class="contents"
			use:enhance
		>
			<input type="hidden" name="categoryId" value={category.id} />
			<Form.Field {form} name="amount" class="h-full w-full">
				<Form.Control>
					{#snippet children({ props })}
						<InputCurrency
							{...props}
							intlConfig={{ locale, ...numberFormatOptions }}
							bind:value={$formData.amount}
							class="h-full w-full rounded-none px-2 text-right font-currency ring-0 outline-none"
							selectOnFocus
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<input type="submit" value="" class="hidden" />
		</form>
	</Popover.ContentStatic>
</Popover.Root>
