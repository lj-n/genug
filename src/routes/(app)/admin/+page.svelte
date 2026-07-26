<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { FormField } from '$lib/components/ui/form-field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import {
		createUser,
		getUsers,
		removeUser,
		resetDatabase
	} from '$lib/remote-functions/admin.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { copyToClipboard } from '$lib/utils/copy-to-clipboard';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { slide } from 'svelte/transition';
	import ArrowCounterClockwiseIcon from '~icons/ph/arrow-counter-clockwise';
	import CopySimpleIcon from '~icons/ph/copy-simple';
	import DotsThreeIcon from '~icons/ph/dots-three-vertical';
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
	let resetPassword = $state<string>();
	let generatedPassword = $derived(createUser.result?.password ?? resetPassword);

	$effect(() => {
		if (generatedPassword) {
			openDialog = true;
		}
	});

	const resetForm = (userId: string) =>
		document.getElementById(`reset-password-${userId}`) as HTMLFormElement | null;
</script>

<Page.Root>
	<Page.Header>
		<Page.Title />
	</Page.Header>

	<Page.Content class="max-w-xl">
		<div class="space-y-3">
			<p class="text-muted">{m.admin_description()}</p>

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

			<Separator class="mt-6 mb-3" />
			<h2 class="font-semibold">{m.admin_users_title()}</h2>

			<ul aria-label="Users">
				{#each await getUsers() as user (user.id)}
					{@const isCurrentUser = user.id === admin.id}
					<li transition:slide={{ axis: 'y', duration: 300 }} class="pb-2 last:pb-0">
						<div class="flex items-center gap-1.5 rounded-lg bg-muted/5 px-3 py-2">
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
								<!-- Persistent form outside the portalled menu, so its submit
								     lifecycle survives the menu closing on select. -->
								<ResetPasswordForm
									userId={user.id}
									onReset={(newPassword) => (resetPassword = newPassword)}
								/>

								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class={buttonVariants({ size: 'icon-sm', variant: 'ghost' }) +
											' ml-auto text-muted'}
									>
										<DotsThreeIcon />
										<span class="sr-only">{m.admin_user_actions_sr()}</span>
									</DropdownMenu.Trigger>

									<DropdownMenu.Content align="end" class="w-fit">
										<DropdownMenu.Item onSelect={() => resetForm(user.id)?.requestSubmit()}>
											<ArrowCounterClockwiseIcon />
											{m.admin_reset_password_sr()}
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											class="text-error data-highlighted:bg-error/10 data-highlighted:text-error"
											onSelect={() => {
												selectedUserId = user.id;
												openAlertDialog = true;
											}}
										>
											<TrashIcon />
											{m.delete()}
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			<Separator class="mt-6 mb-3" />
			<h2 class="font-semibold text-error">Danger Zone</h2>

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
	<Dialog.Content>
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
