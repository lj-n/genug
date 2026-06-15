<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { editAccount, getAccount } from '$lib/remote-functions/account.remote';
	import PencilIcon from '~icons/ph/pencil';

	import { FormBody } from '../ui/form-body';
	import { FormField } from '../ui/form-field';
	import { Input } from '../ui/input';

	let { accountId }: { accountId: string } = $props();

	const account = $derived(await getAccount(accountId));

	let open = $state(false);

	const formId = $props.id();
</script>

<Dialog.Root
	bind:open
	onOpenChangeComplete={(isOpen) => {
		if (!isOpen) {
			editAccount.fields.accountName.set(account.name);
		}
	}}
>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<PencilIcon class="size-5" />
				<span class="sr-only">{m.account_settings_title()}</span>
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.account_set_name_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.account_set_name_description()}</p>
			</Dialog.Description>
		</Dialog.Header>

		<FormBody
			{...editAccount.enhance(async (f) => {
				if (await f.submit()) {
					open = false;
				}
			})}
			id={formId}
		>
			<input {...editAccount.fields.accountId.as('hidden', accountId)} />

			<FormField field={editAccount.fields.accountName} label={m.account_label_name()}>
				{#snippet input(field)}
					<Input {...field.as('text', account.name)} class="text-base" />
				{/snippet}
			</FormField>
		</FormBody>

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
			<Button type="submit" form={formId}>{m.account_save()}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
