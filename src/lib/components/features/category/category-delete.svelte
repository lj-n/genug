<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { getMonthly } from '$lib/remote-functions/budget.remote';
	import {
		deleteCategory,
		getCategories,
		getCategoryById,
		getCategoryDeletability
	} from '$lib/remote-functions/category.remote';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import TrashIcon from '~icons/ph/trash';

	let {
		category,
		currency,
		onDeleted
	}: {
		category: Awaited<ReturnType<typeof getCategoryById>>;
		currency: (typeof CURRENCIES)[number];
		onDeleted: () => void;
	} = $props();

	const deletability = $derived(await getCategoryDeletability({ categoryId: category.id }));

	let noRemainingBudget = $derived(deletability.remainingBalance === 0);
	let noTransactions = $derived(deletability.transactionCount === 0);
	let deletable = $derived(deletability.deletable);
</script>

<section class="flex flex-col gap-3 rounded-md border border-muted/20 bg-background p-3 shadow-xs">
	<h2 class="text-lg font-semibold">
		{m.category_section_title_delete()}
	</h2>

	<p class="text-muted">
		{m.category_delete_info()}
	</p>

	{#if !deletable}
		<div class="flex flex-col gap-2 rounded-md bg-error/10 p-2 text-error">
			{#if !noRemainingBudget}
				<div>
					<ParaglideMessage message={m.category_not_deletable_balance} inputs={{}}>
						{#snippet sum()}
							<span class="font-semibold tabular-nums">
								{formatMoney({
									currency,
									money: asMoney(deletability.remainingBalance)
								})}
							</span>
						{/snippet}

						{#snippet required()}
							<span class="font-semibold tabular-nums">
								{formatMoney({ currency, money: asMoney(0) })}
							</span>
						{/snippet}
					</ParaglideMessage>
				</div>
			{/if}

			{#if !noTransactions}
				<div>
					{m.category_not_deletable_transactions({ count: deletability.transactionCount })}
				</div>
			{/if}
		</div>
	{/if}

	<AlertDialogForm
		form={deleteCategory}
		onSuccess={() => onDeleted()}
		updates={() => [getCategories, getMonthly]}
	>
		{#snippet trigger(props)}
			<Button
				{...props}
				variant="destructive"
				class="mt-auto ml-auto"
				disabled={!deletable}
				aria-disabled={!deletable}
			>
				<TrashIcon class="size-4" />
				{m.category_delete_button()}
			</Button>
		{/snippet}

		{#snippet header()}
			<AlertDialog.Title>{m.category_delete_confirm_title()}</AlertDialog.Title>
			<AlertDialog.Description>
				{m.category_delete_confirm_description({ name: category.name })}
			</AlertDialog.Description>
		{/snippet}

		{#snippet fields()}
			<input {...deleteCategory.fields.categoryId.as('hidden', category.id)} />
		{/snippet}

		{#snippet footer({ formId, pending })}
			<Button type="submit" form={formId} variant="destructive" loading={pending}>
				{m.category_delete_confirm_action()}
			</Button>
		{/snippet}
	</AlertDialogForm>
</section>
