<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Form from '$lib/components/ui/form';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import * as Popover from '$lib/components/ui/popover';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { cn } from 'tailwind-variants';
	import PhScales from '~icons/ph/scales';
	import PhStackPlus from '~icons/ph/stack-plus';

	import type { PageData } from './$types';
	import type { schemaTransferAssignment } from './schema';

	type Category = PageData['categories'][number];

	let {
		category,
		month,
		otherCategories,
		transferForm
	}: {
		category: Category;
		month: PageData['month'];
		otherCategories: Category[];
		transferForm: SuperValidated<Infer<typeof schemaTransferAssignment>>;
	} = $props();

	const getBudget = getBudgetContext();
	const currency = $derived(getBudget().currency);

	const form = superForm(
		untrack(() => transferForm),
		{
			onUpdated(event) {
				if (event.form.message?.type === 'success') open = false;
			},
			warnings: { duplicateId: false }
		}
	);

	const { enhance, form: formData } = form;

	let open = $state(false);

	$effect(() => {
		if (open) {
			if (category.thisMonthRemaining < 0) {
				$formData = {
					amount: Math.abs(category.thisMonthRemaining),
					fromCategoryId: undefined,
					toCategoryId: category.id
				};
			} else {
				$formData = {
					amount: category.thisMonthRemaining,
					fromCategoryId: category.id,
					toCategoryId: ''
				};
			}
		}
	});

	function getCoverFrom() {
		return $formData.fromCategoryId ?? 'null';
	}
	function setCoverFrom(value: string) {
		$formData = { ...$formData, fromCategoryId: value === 'null' ? undefined : value };
	}

	function getMoveTo() {
		return $formData.toCategoryId || 'null';
	}
	function setMoveTo(value: string) {
		$formData = { ...$formData, toCategoryId: value === 'null' ? '' : value };
	}

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
					action={resolve('/(app)/[budgetId=id]/[month=month]?/transfer', {
						budgetId: category.budgetId,
						month
					})}
					method="POST"
					class="flex flex-col gap-2"
					use:enhance
				>
					<input type="hidden" name="toCategoryId" value={$formData.toCategoryId} />
					<input type="hidden" name="amount" value={$formData.amount} />
					<input type="hidden" name="fromCategoryId" value={$formData.fromCategoryId ?? ''} />

					<SelectCommand
						items={coverSourceItems}
						bind:value={getCoverFrom, setCoverFrom}
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
					action={resolve('/(app)/[budgetId=id]/[month=month]?/transfer', {
						budgetId: category.budgetId,
						month
					})}
					method="POST"
					class="flex flex-col gap-2"
					use:enhance
				>
					<input type="hidden" name="fromCategoryId" value={$formData.fromCategoryId} />
					<input type="hidden" name="toCategoryId" value={$formData.toCategoryId} />

					<Form.Field {form} name="amount">
						<Form.Control>
							{#snippet children({ props })}
								<InputCurrency
									{...props}
									{currency}
									bind:value={$formData.amount}
									allowNegativeValue={false}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<SelectCommand
						items={moveTargetItems}
						bind:value={getMoveTo, setMoveTo}
						textEmptyTrigger={m.budget_monthly_action_select_category()}
						textInputPlaceholder={m.budget_monthly_action_select_category()}
						textListEmpty={m.budget_monthly_action_select_category()}
					/>

					<button
						type="submit"
						disabled={!$formData.toCategoryId || !$formData.amount || $formData.amount <= 0}
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
