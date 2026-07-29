<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreAccount } from '$lib/remote-functions/account.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	let { account }: { account: { id: string; name: string } } = $props();

	const form = $derived(restoreAccount.for(account.id));
	// The row leaving the archive list is the success signal — no toast.
	const submit = createFormSubmit(() => form, { toast: {} });
</script>

<span class="line-clamp-1">{account.name}</span>
<form {...submit.attrs}>
	<input {...form.fields.accountId.as('hidden', account.id)} />
	<Button
		type="submit"
		size="xs"
		variant="link"
		class="px-0"
		loading={submit.pending}
		{@attach submit.anchor}
	>
		{m.account_archive_restore_button()}
	</Button>
</form>
