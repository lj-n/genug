<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { editAccount, getAccount } from '$lib/remote-functions/account.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	let { account }: { account: Awaited<ReturnType<typeof getAccount>> } = $props();

	const submit = createFormSubmit(() => editAccount, {
		toast: { placement: 'left', success: () => m.saved() }
	});
</script>

<form {...submit.attrs} class="grid gap-3">
	<h2 class="font-semibold">{m.account_set_name_title()}</h2>

	<p class="text-muted">{m.account_set_name_description()}</p>

	<input {...editAccount.fields.accountId.as('hidden', account.id)} />

	<FormField field={editAccount.fields.accountName} label={m.account_label_name()}>
		{#snippet input(field)}
			<Input {...field.as('text', account.name)} placeholder={m.account_label_name()} />
		{/snippet}
	</FormField>

	<Button {@attach submit.anchor} type="submit" class="ml-auto" loading={submit.pending}>
		{m.account_save()}
	</Button>
</form>
