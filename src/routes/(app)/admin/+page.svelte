<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FormField } from '$lib/components/ui/form-field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import {
		createUser,
		getUsers,
		removeUser,
		resetDatabase,
		resetUserPassword
	} from '$lib/remote-functions/admin.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { copyToClipboard } from '$lib/utils/copy-to-clipboard';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { slide } from 'svelte/transition';
	import CopySimpleIcon from '~icons/ph/copy-simple';
	import TrashIcon from '~icons/ph/trash';
	import UserCircleIcon from '~icons/ph/user-circle';
	import UserCirclePlusIcon from '~icons/ph/user-circle-plus';

	import ResetPasswordForm from './reset-password-form.svelte';

	const admin = $derived(await getUser());

	const createUserSubmit = createFormSubmit(() => createUser, {
		onSuccess: (form) => form.element.reset(),
		toast: {}
	});

	let openDialog = $state(false);
	let openAlertDialog = $state(false);
	let selectedUserId = $state('');
	let generatedPassword = $derived(
		createUser.result?.password ?? resetUserPassword.result?.newPassword
	);

	$effect(() => {
		if (generatedPassword) {
			openDialog = true;
		}
	});
</script>

<Page.Root>
	<Page.Header>
		<Page.Title />
	</Page.Header>

	<Page.Content>
		<div class="grid max-w-2xl gap-3">
			<div class="rounded-lg bg-muted/5 p-3">
				{m.admin_description()}
			</div>

			<form {...createUserSubmit.attrs}>
				<FormField
					field={createUser.fields.username}
					label={m.admin_input_placeholder_username()}
					hideLabel
				>
					{#snippet input(field)}
						<InputGroup.Root>
							<InputGroup.Input
								{...field.as('text')}
								placeholder={m.admin_input_placeholder_username()}
								class="w-full bg-transparent"
							/>

							<InputGroup.Addon>
								<UserCirclePlusIcon />
							</InputGroup.Addon>

							<InputGroup.Addon align="inline-end">
								<Button
									type="submit"
									loading={createUserSubmit.pending}
									{@attach createUserSubmit.anchor}
								>
									{m.admin_create_user_button()}
								</Button>
							</InputGroup.Addon>
						</InputGroup.Root>
					{/snippet}
				</FormField>
			</form>

			<div class="text-lg font-medium tracking-tighter">{m.admin_users_title()}</div>

			<ul aria-label="Users">
				{#each await getUsers() as user (user.id)}
					{@const isCurrentUser = user.id === admin.id}
					<li transition:slide={{ axis: 'y', duration: 300 }} class="group pb-2 last:pb-0">
						<div
							class="flex items-center gap-1.5 rounded-lg border border-muted/20 bg-surface-high p-3 shadow-xs"
						>
							<UserCircleIcon class="size-5 text-muted" />
							<div>
								{user.username}
								{#if isCurrentUser}
									<span class="text-muted"> {m.admin_user_you_indicator()} </span>
								{/if}
							</div>

							{#if isCurrentUser}
								<div class="ml-auto rounded-lg bg-info/10 px-3 py-0.5 text-info">
									{m.admin_role_admin_label()}
								</div>
							{:else}
								<ButtonGroup.Root class="ml-auto opacity-0 group-hover:opacity-100">
									<ResetPasswordForm userId={user.id} />

									<Button
										size="icon-sm"
										variant="destructive"
										onclick={() => {
											selectedUserId = user.id;
											openAlertDialog = true;
										}}
									>
										<TrashIcon />
										<span class="sr-only">{m.admin_remove_user_sr()}</span>
									</Button>
								</ButtonGroup.Root>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div class="space-y-2">
			<div class="text-lg font-medium tracking-tighter text-error">Danger Zone</div>

			<AlertDialogForm form={resetDatabase}>
				{#snippet trigger(props)}
					<Button {...props} variant="destructive">Reset Instance</Button>
				{/snippet}

				{#snippet header()}
					<AlertDialog.Title>{m.admin_reset_database_confirm_title()}</AlertDialog.Title>
					<AlertDialog.Description>
						{m.admin_reset_database_confirm_description()}
					</AlertDialog.Description>
				{/snippet}

				{#snippet footer({ formId, pending })}
					<Button type="submit" form={formId} variant="destructive" loading={pending}>
						{m.admin_reset_database_confirm_action()}
					</Button>
				{/snippet}
			</AlertDialogForm>
		</div>
	</Page.Content>
</Page.Root>

<AlertDialogForm form={removeUser} bind:open={openAlertDialog}>
	{#snippet header()}
		<AlertDialog.Title>{m.admin_delete_user_confirm_title()}</AlertDialog.Title>
		<AlertDialog.Description>
			{m.admin_delete_user_confirm_description()}
		</AlertDialog.Description>
	{/snippet}

	{#snippet fields()}
		<input {...removeUser.fields.userId.as('hidden', selectedUserId)} />
	{/snippet}

	{#snippet footer({ formId, pending })}
		<Button type="submit" form={formId} variant="destructive" loading={pending}>
			{m.delete()}
		</Button>
	{/snippet}
</AlertDialogForm>

<Dialog.Root bind:open={openDialog}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{m.admin_generated_password_title()}</Dialog.Title>
			<Dialog.Description>{m.admin_generated_password_description()}</Dialog.Description>
		</Dialog.Header>

		<div class="flex items-center justify-between gap-4 rounded-lg bg-muted/5 p-2">
			<div class="p-3 text-lg text-info" aria-label="generated-password">{generatedPassword}</div>
			<Button size="icon" {@attach copyToClipboard(generatedPassword)}>
				<CopySimpleIcon />
			</Button>
		</div>

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'default' })}>{m.dialog_close()}</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
