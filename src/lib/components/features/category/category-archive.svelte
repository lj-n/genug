<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import {
		archiveCategory,
		getCategoryArchivability,
		getCategoryById
	} from '$lib/remote-functions/category.remote';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import ArchiveTrayBoldIcon from '~icons/ph/archive-tray-bold';

	let {
		category,
		currency
	}: {
		category: Awaited<ReturnType<typeof getCategoryById>>;
		currency: (typeof CURRENCIES)[number];
	} = $props();

	// The item visibly moving to the archive is the success signal — no toast.
	const submit = createFormSubmit(() => archiveCategory, { toast: {} });

	const archivability = $derived(await getCategoryArchivability({ categoryId: category.id }));

	let noRemainingBudget = $derived(archivability.remainingBalance === 0);
	let noPendingTransactions = $derived(archivability.pendingTransactionCount === 0);
	let archivable = $derived(archivability.archivable);
</script>

<section class="flex flex-col gap-3 rounded-md border border-muted/20 bg-background p-3 shadow-xs">
	<h2 class="text-lg font-semibold">
		{m.category_section_title_archive()}
	</h2>

	<p class="text-muted">
		{m.category_archive_info()}
	</p>

	{#if !archivable}
		<div class="flex flex-col gap-2 rounded-md bg-error/10 p-2 text-error">
			{#if !noRemainingBudget}
				<div>
					<ParaglideMessage message={m.category_not_archivable_balance} inputs={{}}>
						{#snippet sum()}
							<span class="font-currency font-medium">
								{formatMoney({
									currency,
									money: asMoney(archivability.remainingBalance)
								})}
							</span>
						{/snippet}

						{#snippet required()}
							<span class="font-currency font-medium">
								{formatMoney({ currency, money: asMoney(0) })}
							</span>
						{/snippet}
					</ParaglideMessage>
				</div>
			{/if}

			{#if !noPendingTransactions}
				<div>
					{m.category_not_archivable_pending_transactions()}
				</div>
			{/if}
		</div>
	{/if}

	<form {...submit.attrs} class="mt-auto ml-auto">
		<input {...archiveCategory.fields.categoryId.as('hidden', category.id)} />
		<Button
			type="submit"
			disabled={!archivable}
			aria-disabled={!archivable}
			loading={submit.pending}
			{@attach submit.anchor}
		>
			<ArchiveTrayBoldIcon class="size-4" />
			{m.category_archive_button()}
		</Button>
	</form>
</section>
