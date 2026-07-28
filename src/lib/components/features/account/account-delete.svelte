<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import {
		deleteAccount,
		getAccount,
		getAccountDeletability,
		getAccounts
	} from '$lib/remote-functions/account.remote';
	import TrashIcon from '~icons/ph/trash';

	let {
		account,
		onDeleted
	}: {
		account: Awaited<ReturnType<typeof getAccount>>;
		onDeleted: () => void;
	} = $props();

	const deletability = $derived(await getAccountDeletability({ accountId: account.id }));

	let noTransactions = $derived(deletability.transactionCount === 0);
	let deletable = $derived(deletability.deletable);
</script>

<section class="flex flex-col gap-3">
	<h2 class="font-semibold">
		{m.account_section_title_delete()}
	</h2>

	<p class="text-muted">
		{m.account_delete_info()}
	</p>

	{#if !deletable}
		<div class="flex flex-col gap-2 rounded-md bg-error/10 p-2 text-error">
			{#if !noTransactions}
				<div>
					{m.account_not_deletable_transactions({ count: deletability.transactionCount })}
				</div>
			{/if}
		</div>
	{/if}

	<AlertDialogForm form={deleteAccount} onSuccess={() => onDeleted()} updates={() => [getAccounts]}>
		{#snippet trigger(props)}
			<Button
				{...props}
				variant="destructive"
				class="mt-auto ml-auto"
				disabled={!deletable}
				aria-disabled={!deletable}
			>
				<TrashIcon class="size-4" />
				{m.account_delete_button()}
			</Button>
		{/snippet}

		{#snippet header()}
			<AlertDialog.Title>{m.account_delete_confirm_title()}</AlertDialog.Title>
			<AlertDialog.Description>
				{m.account_delete_confirm_description({ name: account.name })}
			</AlertDialog.Description>
		{/snippet}

		{#snippet fields()}
			<input {...deleteAccount.fields.accountId.as('hidden', account.id)} />
		{/snippet}

		{#snippet footer({ formId, pending })}
			<Button type="submit" form={formId} variant="destructive" loading={pending}>
				{m.account_delete_confirm_action()}
			</Button>
		{/snippet}
	</AlertDialogForm>
</section>
