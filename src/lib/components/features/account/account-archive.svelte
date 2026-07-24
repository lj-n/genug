<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import {
		archiveAccount,
		getAccount,
		getAccountArchivability
	} from '$lib/remote-functions/account.remote';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import ArchiveTrayBoldIcon from '~icons/ph/archive-tray-bold';

	let {
		account,
		currency,
		onArchived
	}: {
		account: Awaited<ReturnType<typeof getAccount>>;
		currency: (typeof CURRENCIES)[number];
		onArchived: () => void;
	} = $props();

	// Unlike a category (which visibly leaves the month grid), an account is
	// archived from its own detail page — so navigating away to the archive is
	// the success signal. No toast.
	const submit = createFormSubmit(() => archiveAccount, {
		onSuccess: () => onArchived(),
		toast: {}
	});

	const archivability = $derived(await getAccountArchivability({ accountId: account.id }));

	let noBalance = $derived(archivability.balance === 0);
	let noPendingTransactions = $derived(archivability.pendingTransactionCount === 0);
	let archivable = $derived(archivability.archivable);
</script>

<section class="flex flex-col gap-3 rounded-md border border-muted/20 bg-background p-3 shadow-xs">
	<h2 class="text-lg font-semibold">
		{m.account_section_title_archive()}
	</h2>

	<p class="text-muted">
		{m.account_archive_info()}
	</p>

	{#if !archivable}
		<div class="flex flex-col gap-2 rounded-md bg-error/10 p-2 text-error">
			{#if !noBalance}
				<div>
					<ParaglideMessage message={m.account_not_archivable_balance} inputs={{}}>
						{#snippet sum()}
							<span class="font-currency font-medium">
								{formatMoney({
									currency,
									money: asMoney(archivability.balance)
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
					{m.account_not_archivable_pending_transactions()}
				</div>
			{/if}
		</div>
	{/if}

	<form {...submit.attrs} class="mt-auto ml-auto">
		<input {...archiveAccount.fields.accountId.as('hidden', account.id)} />
		<Button
			type="submit"
			disabled={!archivable}
			aria-disabled={!archivable}
			loading={submit.pending}
			{@attach submit.anchor}
		>
			<ArchiveTrayBoldIcon class="size-4" />
			{m.account_archive_button()}
		</Button>
	</form>
</section>
