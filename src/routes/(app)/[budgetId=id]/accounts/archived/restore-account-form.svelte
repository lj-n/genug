<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreAccount } from '$lib/remote-functions/account.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import PhHandWithdraw from '~icons/ph/hand-withdraw';

	let { accountId, budgetId }: { accountId: string; budgetId: string } = $props();

	const form = $derived(restoreAccount.for(accountId));

	// The item visibly leaving the list is the success signal — no toast.
	const submit = createFormSubmit(() => form, {
		onSuccess: async () => {
			// Let the list's flip animation finish before navigating away.
			await new Promise((r) => setTimeout(r, 300));
			goto(resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId, budgetId }));
		},
		toast: {}
	});
</script>

<form {...submit.attrs}>
	<input {...form.fields.accountId.as('hidden', accountId)} />
	<Button type="submit" loading={submit.pending} {@attach submit.anchor}>
		<PhHandWithdraw class="size-4" />
		{m.account_archive_restore_button()}
	</Button>
</form>
