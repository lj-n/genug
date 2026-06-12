<script lang="ts">
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import * as Popover from '$lib/components/ui/popover';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { getBudget, transferBudget } from '$lib/remote-functions/budget.remote';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { cn } from 'tailwind-variants';
	import PhScales from '~icons/ph/scales';
	import PhStackPlus from '~icons/ph/stack-plus';

	type Category = {
		budgetId: string;
		id: string;
		name: string;
		thisMonthRemaining: number;
	};

	let {
		budgetId,
		category,
		month,
		otherCategories
	}: {
		budgetId: string;
		category: Category;
		month: string;
		otherCategories: Category[];
	} = $props();

	const { currency } = $derived(await getBudget({ budgetId }));

	const scopedForm = $derived(transferBudget.for(category.id));

	let open = $state(false);

	$effect(() => {
		if (open) {
			if (category.thisMonthRemaining < 0) {
				scopedForm.fields.amount.set(Math.abs(category.thisMonthRemaining));
				scopedForm.fields.toCategoryId.set(category.id);
				scopedForm.fields.fromCategoryId.set('');
			} else {
				scopedForm.fields.amount.set(category.thisMonthRemaining);
				scopedForm.fields.fromCategoryId.set(category.id);
				scopedForm.fields.toCategoryId.set('');
			}
		}
	});

	const coverSourceItems = $derived(
		otherCategories
			.filter((c) => c.thisMonthRemaining > 0)
			.map((c) => ({
				id: c.id,
				name: `${c.name} (${formatCurrency({ centValue: c.thisMonthRemaining, currency })})`
			}))
	);

	const moveTargetItems = $derived(
		otherCategories.map((c) => ({
			id: c.id,
			name: `${c.name} (${formatCurrency({ centValue: c.thisMonthRemaining, currency })})`
		}))
	);

	const badgeClass = cn('w-fit rounded-full border px-2 font-currency');

	const toCategoryId = $derived(scopedForm.fields.toCategoryId.value() ?? '');
	const fromCategoryId = $derived(scopedForm.fields.fromCategoryId.value() ?? '');
	const amount = $derived(scopedForm.fields.amount.value() ?? 0);
</script>

{#if category.thisMonthRemaining === 0}
	<span class={cn(badgeClass, 'border-muted/20 bg-muted/10')}>
		{formatCurrency({ centValue: 0, currency })}
	</span>
{:else}
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					class={cn(
						badgeClass,
						'cursor-pointer',
						category.thisMonthRemaining < 0
							? 'border-error/50 bg-error/20 hover:bg-error/30'
							: 'border-success/80 bg-success/20 hover:bg-success/30'
					)}
				>
					{formatCurrency({ centValue: category.thisMonthRemaining, currency })}
				</button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content align="end" class="w-fit min-w-56 gap-2 p-3">
			{#if category.thisMonthRemaining < 0}
				<!-- Cover from category (or unassigned money) -->
				<form
					{...scopedForm.enhance(async (form) => {
						if (await form.submit()) open = false;
					})}
					class="flex flex-col gap-2"
				>
					<input {...scopedForm.fields.budgetId.as('hidden', budgetId)} />
					<input
						type="hidden"
						name={scopedForm.fields.month.as('number').name}
						value={parseInt(month)}
					/>
					<input {...scopedForm.fields.toCategoryId.as('hidden', category.id)} />
					<input type="hidden" name={scopedForm.fields.amount.as('number').name} value={amount} />
					<input {...scopedForm.fields.fromCategoryId.as('hidden', fromCategoryId)} />

					<SelectCommand
						items={coverSourceItems}
						bind:value={
							() => fromCategoryId || 'null',
							(v) => scopedForm.fields.fromCategoryId.set(v === 'null' ? '' : v)
						}
						textEmptyTrigger={m.budget_monthly_action_cover_from_unassigned()}
						textInputPlaceholder={m.budget_monthly_action_select_category()}
						textListEmpty={m.budget_monthly_action_select_category()}
					/>

					<button
						type="submit"
						class="flex items-center justify-center gap-2 rounded-sm bg-interactive/10 px-3 py-1.5 text-sm text-interactive hover:bg-interactive/20"
					>
						<PhScales />
						{m.budget_monthly_action_cover_from_category()}
					</button>
				</form>
			{:else}
				<!-- Move amount to category -->
				<form
					{...scopedForm.enhance(async (form) => {
						if (await form.submit()) open = false;
					})}
					class="flex flex-col gap-2"
				>
					<input {...scopedForm.fields.budgetId.as('hidden', budgetId)} />
					<input
						type="hidden"
						name={scopedForm.fields.month.as('number').name}
						value={parseInt(month)}
					/>
					<input {...scopedForm.fields.fromCategoryId.as('hidden', category.id)} />
					<input {...scopedForm.fields.toCategoryId.as('hidden', toCategoryId)} />

					<InputCurrency
						name={scopedForm.fields.amount.as('number').name}
						bind:value={() => amount, (v) => scopedForm.fields.amount.set(v)}
						{currency}
						allowNegativeValue={false}
					/>

					<SelectCommand
						items={moveTargetItems}
						bind:value={
							() => toCategoryId || 'null',
							(v) => scopedForm.fields.toCategoryId.set(v === 'null' ? '' : v)
						}
						textEmptyTrigger={m.budget_monthly_action_select_category()}
						textInputPlaceholder={m.budget_monthly_action_select_category()}
						textListEmpty={m.budget_monthly_action_select_category()}
					/>

					<button
						type="submit"
						disabled={!toCategoryId || !amount || amount <= 0}
						class="flex items-center justify-center gap-2 rounded-sm bg-interactive/10 px-3 py-1.5 text-sm text-interactive hover:bg-interactive/20 disabled:pointer-events-none disabled:opacity-50"
					>
						<PhStackPlus />
						{m.budget_monthly_action_move_to_category()}
					</button>
				</form>
			{/if}
		</Popover.Content>
	</Popover.Root>
{/if}
