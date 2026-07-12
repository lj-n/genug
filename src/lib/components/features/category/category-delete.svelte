<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { buttonVariants } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import {
		deleteCategory,
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

	let confirmOpen = $state(false);
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

	<AlertDialog.Root bind:open={confirmOpen}>
		<AlertDialog.Trigger
			class="mt-auto ml-auto {buttonVariants({ variant: 'destructive' })}"
			disabled={!deletable}
			aria-disabled={!deletable}
		>
			<TrashIcon class="size-4" />
			{m.category_delete_button()}
		</AlertDialog.Trigger>

		<AlertDialog.Content>
			<form
				{...deleteCategory.enhance(async (form) => {
					if (await form.submit()) {
						onDeleted();
					}
				})}
				class="contents"
			>
				<input {...deleteCategory.fields.categoryId.as('hidden', category.id)} />

				<AlertDialog.Header>
					<AlertDialog.Title>{m.category_delete_confirm_title()}</AlertDialog.Title>
					<AlertDialog.Description>
						{m.category_delete_confirm_description({ name: category.name })}
					</AlertDialog.Description>
				</AlertDialog.Header>

				<AlertDialog.Footer>
					<AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
					<AlertDialog.Action type="submit" variant="destructive">
						{m.category_delete_confirm_action()}
					</AlertDialog.Action>
				</AlertDialog.Footer>
			</form>
		</AlertDialog.Content>
	</AlertDialog.Root>
</section>
