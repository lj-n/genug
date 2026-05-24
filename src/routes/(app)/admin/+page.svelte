<script lang="ts">
	import { resolve } from '$app/paths';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Page from '$lib/components/ui/page';
	import { copyToClipboard } from '$lib/utils/copy-to-clipboard';
	import { tick, untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import ArrowCounterClockwiseIcon from '~icons/ph/arrow-counter-clockwise';
	import CopySimpleIcon from '~icons/ph/copy-simple';
	import TrashIcon from '~icons/ph/trash';
	import UserCircleIcon from '~icons/ph/user-circle';
	import UserCirclePlusIcon from '~icons/ph/user-circle-plus';

	import type { PageProps } from './$types';

	import { schemaUserCreate } from './schema';

	let { data }: PageProps = $props();

	let openDeleteUserDialog = $state(false);
	const formDeleteUser = superForm(
		untrack(() => data.formDeleteUser),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					openDeleteUserDialog = false;
				}
			}
		}
	);
	const { enhance: formDeleteUserEnhance, form: formDeleteUserData } = formDeleteUser;

	let openPasswordDialog = $state(false);
	let generatedPassword: string | undefined = $state();

	const formResetUserPassword = superForm(
		untrack(() => data.formResetUserPassword),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					generatedPassword = event.form.message.text;
					openPasswordDialog = true;
				}
			}
		}
	);
	const { enhance: formResetUserPasswordEnhance, form: formResetUserPasswordData } =
		formResetUserPassword;

	const formCreateUser = superForm(
		untrack(() => data.formCreateUser),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					generatedPassword = event.form.message.text;
					openPasswordDialog = true;
				}
			},
			validators: zod4Client(schemaUserCreate)
		}
	);
	const { enhance: formCreateUserEnhance, form: formCreateUserData } = formCreateUser;
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>Admin Einstellungen</Page.Title>
	</Page.Header>

	<Page.Content>
		<div class="grid max-w-2xl gap-3">
			<div class="rounded-lg bg-muted/5 p-3">
				Füge hier neue Benutzer hinzu. Die Nutzer melden sich mit Benutzernamen und Passwort an. Das
				Passwort wird vom Administrator (dir) generiert und zur Verfügung gestellt. Benutzer können
				ihren Benutzernamen und ihr Passwort auf ihrer Einstellungsseite ändern. Nur du kannst
				Benutzer hinzufügen oder löschen.
			</div>

			<form action={resolve('/(app)/admin?/createUser')} method="post" use:formCreateUserEnhance>
				<div class="flex w-full items-center gap-2">
					<Form.Field form={formCreateUser} name="username" class="w-full">
						<Form.Control>
							{#snippet children({ props })}
								<InputGroup.Root>
									<InputGroup.Input
										{...props}
										bind:value={$formCreateUserData.username}
										placeholder="Nutzername"
										class="w-full bg-transparent"
									/>
									<InputGroup.Addon>
										<UserCirclePlusIcon />
									</InputGroup.Addon>

									<InputGroup.Addon align="inline-end">
										<Form.Button type="submit">Benutzer Erstellen</Form.Button>
									</InputGroup.Addon>
								</InputGroup.Root>
							{/snippet}
						</Form.Control>

						<Form.FieldErrors />
					</Form.Field>
				</div>
			</form>

			<div class="text-lg font-medium tracking-tighter">Benutzer</div>

			<ul>
				{#each data.users as user (user.id)}
					{@const isCurrentUser = user.id === data.user.id}
					<li transition:slide={{ axis: 'y', duration: 300 }} class="group pb-2 last:pb-0">
						<div
							class="flex items-center gap-1.5 rounded-lg border border-muted/20 bg-surface-high p-3 shadow-xs"
						>
							<UserCircleIcon class="size-5 text-muted" />
							<div>
								{user.name}
								{#if isCurrentUser}
									<span class="text-muted"> (Du) </span>
								{/if}
							</div>

							{#if isCurrentUser}
								<div class="ml-auto rounded-lg bg-info/10 px-3 py-0.5 text-info">Admin</div>
							{:else}
								<ButtonGroup.Root class="ml-auto opacity-0 group-hover:opacity-100">
									<Button
										size="icon-sm"
										onclick={() => {
											formResetUserPassword.reset({ data: { userId: user.id } });
											tick().then(() => {
												formResetUserPassword.submit();
											});
										}}
									>
										<ArrowCounterClockwiseIcon />
										<span class="sr-only"> Passwort Zurücksetzen </span>
									</Button>

									<Button
										size="icon-sm"
										variant="destructive"
										onclick={() => {
											formDeleteUser.reset({ data: { userId: user.id } });
											openDeleteUserDialog = true;
										}}
									>
										<TrashIcon />
										<span class="sr-only"> Benutzer Entfernen </span>
									</Button>
								</ButtonGroup.Root>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<AlertDialog.Root
			bind:open={openDeleteUserDialog}
			onOpenChangeComplete={(isOpen) => {
				if (!isOpen) {
					formDeleteUser.reset();
				}
			}}
		>
			<AlertDialog.Content>
				<form
					action={resolve('/(app)/admin?/removeUser')}
					use:formDeleteUserEnhance
					class="contents"
					method="post"
				>
					<AlertDialog.Header>
						<AlertDialog.Title>Bist du dir ganz sicher?</AlertDialog.Title>
						<AlertDialog.Description>
							Diese Aktion kann nicht rückgängig gemacht werden. Der Benutzer und all seine Daten
							werden gelöscht werden.
						</AlertDialog.Description>
					</AlertDialog.Header>

					<input type="hidden" name="userId" bind:value={$formDeleteUserData.userId} />

					<AlertDialog.Footer>
						<AlertDialog.Cancel type="button">Abbrechen</AlertDialog.Cancel>
						<AlertDialog.Action type="submit" variant="destructive">Löschen</AlertDialog.Action>
					</AlertDialog.Footer>
				</form>
			</AlertDialog.Content>
		</AlertDialog.Root>

		<Dialog.Root
			bind:open={openPasswordDialog}
			onOpenChangeComplete={(open) => {
				if (!open) {
					generatedPassword = '';
				}
			}}
		>
			<Dialog.Content class="max-w-lg">
				<Dialog.Header>
					<Dialog.Title>Zufällig generiertes Passwort</Dialog.Title>
					<Dialog.Description>Sende das generierte Password an den Benutzer</Dialog.Description>
				</Dialog.Header>

				<div class="flex items-center justify-between gap-4 rounded-lg bg-muted/5 p-2">
					<div class="p-3 text-lg text-info">{generatedPassword}</div>
					<Button size="icon" {@attach copyToClipboard(generatedPassword)}>
						<CopySimpleIcon />
					</Button>
				</div>

				<Dialog.Footer>
					<Dialog.Close class={buttonVariants({ variant: 'default' })}>Schließen</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<form
			action={resolve('/(app)/admin?/resetUserPassword')}
			use:formResetUserPasswordEnhance
			method="post"
			class="hidden"
		>
			<input type="hidden" name="userId" value={$formResetUserPasswordData.userId} />
		</form>
	</Page.Content>
</Page.Root>
