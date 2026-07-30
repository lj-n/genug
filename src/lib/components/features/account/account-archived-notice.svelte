<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreAccount } from '$lib/remote-functions/account.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import ArchiveIcon from '~icons/ph/archive';
	import HandWithdrawIcon from '~icons/ph/hand-withdraw';

	let { accountId }: { accountId: string } = $props();

	const form = $derived(restoreAccount.for(accountId));

	// Restoring in place: the page's account query refreshes, `archivedAt`
	// clears, and the active detail view (with the transaction table) returns.
	const submit = createFormSubmit(() => form, { toast: {} });
</script>

<section
	class="flex flex-col items-center gap-3 rounded-md border border-muted/20 bg-muted/5 p-8 text-center"
>
	<ArchiveIcon class="size-10 text-muted" />

	<h2 class="font-semibold">{m.account_archived_notice_title()}</h2>

	<p class="max-w-prose text-muted">{m.account_archived_notice_description()}</p>

	<form {...submit.attrs}>
		<input {...form.fields.accountId.as('hidden', accountId)} />
		<Button type="submit" loading={submit.pending} {@attach submit.anchor}>
			<HandWithdrawIcon class="size-4" />
			{m.account_archive_restore_button()}
		</Button>
	</form>
</section>
