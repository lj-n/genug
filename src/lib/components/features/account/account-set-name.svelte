<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { DialogForm } from '$lib/components/ui/dialog-form';
	import { m } from '$lib/paraglide/messages';
	import { editAccount, getAccount } from '$lib/remote-functions/account.remote';
	import PencilIcon from '~icons/ph/pencil';

	import { FormField } from '../../ui/form-field';
	import { Input } from '../../ui/input';

	let { accountId }: { accountId: string } = $props();

	const accountQuery = $derived(getAccount(accountId));
</script>

<DialogForm enhance={editAccount.enhance}>
	{#snippet trigger(props)}
		<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
			<PencilIcon class="size-5" />
			<span class="sr-only">{m.account_settings_title()}</span>
		</Button>
	{/snippet}

	{#snippet header()}
		<Dialog.Title>{m.account_set_name_title()}</Dialog.Title>
		<Dialog.Description class="grid gap-4">
			<p>{m.account_set_name_description()}</p>
		</Dialog.Description>
	{/snippet}

	{#snippet fields()}
		{@const account = await accountQuery}
		<div class="grid space-y-3 rounded-xl bg-muted/5 p-3">
			<input {...editAccount.fields.accountId.as('hidden', accountId)} />

			<FormField field={editAccount.fields.accountName} label={m.account_label_name()}>
				{#snippet input(field)}
					<Input {...field.as('text', account.name)} class="text-base" />
				{/snippet}
			</FormField>
		</div>
	{/snippet}

	{#snippet footer({ formId })}
		<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
		<Button type="submit" form={formId}>{m.account_save()}</Button>
	{/snippet}
</DialogForm>
