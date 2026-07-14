<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { Month } from '$lib/utils/month';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { Label } from '$lib/components/ui/label';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { m } from '$lib/paraglide/messages';
	import { assignment, getMonthly, getUnassigned } from '$lib/remote-functions/budget.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	type Category = {
		assigned: number;
		budgetId: string;
		id: string;
		name: string;
	};

	let {
		category = $bindable(),
		currency,
		month,
		open = $bindable(false)
	}: {
		category: Category | null;
		currency: (typeof CURRENCIES)[number];
		month: Month;
		open?: boolean;
	} = $props();

	// Scoped apart from the inline popover's `assignment.for(category.id)` so
	// the two assign surfaces never share field state.
	const form = $derived(category === null ? null : assignment.for(`${category.id}-sheet`));

	// The footer buttons live outside the <form> (in the pinned Footer, see
	// ADR-0013) and submit via the form attribute.
	const formId = $props.id();

	const submit = createFormSubmit(() => form!, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		updates: () => [getMonthly, getUnassigned]
	});

	// The form mounts each time the sheet opens; seed the amount from the
	// category's current assignment.
	const initFieldsOnMount: Attachment<HTMLFormElement> = () => {
		if (category === null || form === null) return;
		form.fields.amount.set(category.assigned);
	};
</script>

<ResponsiveModal.Root bind:open onOpenChangeComplete={(isOpen) => !isOpen && (category = null)}>
	<ResponsiveModal.Content class="max-w-lg">
		{#if category !== null && form !== null}
			<ResponsiveModal.Header>
				<ResponsiveModal.Title class="text-xl font-semibold tracking-tighter italic">
					{m.budget_assignment_title({ name: category.name })}
				</ResponsiveModal.Title>
			</ResponsiveModal.Header>

			<ResponsiveModal.Body>
				<form
					id={formId}
					class="flex flex-col gap-4"
					aria-label={m.budget_assignment_title({ name: category.name })}
					{...submit.attrs}
					{@attach submit.anchor}
					{@attach initFieldsOnMount}
				>
					<input {...form.fields.budgetId.as('hidden', category.budgetId)} />
					<input {...form.fields.categoryId.as('hidden', category.id)} />
					<input type="hidden" name={form.fields.month.as('number').name} value={month} />

					<div class="grid gap-1.5">
						<Label>{m.budget_monthly_table_header_amount()}</Label>
						<InputMoney
							name={form.fields.amount.as('number').name}
							aria-label={m.budget_monthly_table_header_amount()}
							bind:value={() => form!.fields.amount.value(), (v) => form!.fields.amount.set(v)}
							{currency}
							aria-invalid={form.fields.amount.issues()?.length ? true : undefined}
							class="text-right font-currency"
							selectOnFocus
						/>
					</div>

					{#if form.fields.allIssues()?.length}
						<p role="alert" class="text-sm text-error">
							{form.fields
								.allIssues()
								?.map((issue) => issue.message)
								.join(' · ')}
						</p>
					{/if}
				</form>
			</ResponsiveModal.Body>

			<ResponsiveModal.Footer>
				<Button
					type="button"
					variant="ghost"
					class="h-11"
					disabled={submit.pending}
					onclick={() => (open = false)}
				>
					{m.cancel()}
				</Button>

				<Button type="submit" form={formId} class="h-11" disabled={submit.pending}>
					{m.save()}
				</Button>
			</ResponsiveModal.Footer>
		{/if}
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
