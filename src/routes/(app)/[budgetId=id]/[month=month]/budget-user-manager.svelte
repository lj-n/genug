<script lang="ts">
	import type { tables } from '$db';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { debounce } from '$lib/utils/debounce';
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import CheckFatIcon from '~icons/ph/check-fat';
	import CircleNotchIcon from '~icons/ph/circle-notch';
	import EnvelopeDuotoneIcon from '~icons/ph/envelope-duotone';
	import UserCircleIcon from '~icons/ph/user-circle';
	import UserCirclePlusIcon from '~icons/ph/user-circle-plus';
	import UsersThreeIcon from '~icons/ph/users-three';
	import XIconBold from '~icons/ph/x-bold';

	import type { schemaInviteUser } from './schema';

	type Role = typeof tables.usersToBudgets.$inferSelect.role;

	let {
		form,
		users
	}: {
		form: SuperValidated<Infer<typeof schemaInviteUser>>;
		users: { id: string; name: string; role: Role }[];
	} = $props();

	let invitedUsers = $derived(users.filter(({ role }) => role === 'INVITEE'));
	let budgetUsers = $derived(users.filter(({ role }) => role !== 'INVITEE'));

	const formInvite = superForm(untrack(() => form));
	const { enhance, errors, form: formData } = formInvite;

	const {
		delayed,
		enhance: submitEnhance,
		submit: submitCheckUsername
	} = superForm(
		{ invite: '' },
		{
			applyAction: false,
			invalidateAll: false,
			multipleSubmits: 'abort',
			onSubmit({ cancel }) {
				if (!$formData.invite) cancel();
			},
			onUpdated({ form }) {
				$errors.invite = form.errors.invite;
			}
		}
	);

	const checkUsername = debounce(submitCheckUsername, 300);
</script>

<Button variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
	<UsersThreeIcon class="size-5" />
</Button>

<Dialog.Root open={true}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<UserCirclePlusIcon class="size-5" />
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-2xl gap-8">
		<Dialog.Header>
			<Dialog.Title>Wer hat Zugriff auf diesen Budgetplan?</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<div>
					Als Ersteller kannst du andere Nutzer einladen, um beim Budgetplan mitzugestalten.
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-2">
			<div class="text-sm font-medium">Nutzer mit Zugriff</div>
			<ul>
				{#each budgetUsers as user (user.id)}
					<li transition:slide={{ axis: 'y', duration: 300 }} class="pb-2 last:pb-0">
						<div
							class="flex items-center gap-1.5 rounded-lg border border-muted/20 bg-surface-high p-3 shadow-sm"
						>
							<UserCircleIcon class="size-5 text-info" />
							<div>
								{user.name}
							</div>

							{#if user.role === 'OWNER'}
								<div class="ml-auto rounded-lg bg-info/10 p-0.5 px-2 text-info">
									Hat den Budgetplan erstellt.
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<form method="post" action="?/inviteUser" use:enhance class="grid gap-2">
			<input type="hidden" name="invite" value={$formData.invite} />

			<div class="text-sm font-medium">Lade andere Nutzer ein</div>

			<div class="rounded-lg bg-muted/5 p-3 text-info">
				Wenn du eine Einladung annimmst, kannst du auf den <b>gesamten</b> Budgetplan und dessen Accounts,
				Kategorien, Transaktionen usw. zugreifen.
			</div>

			<div class="flex w-full items-center gap-2">
				<Form.Field form={formInvite} name="invite" class="w-full">
					<Form.Control>
						{#snippet children({ props })}
							<InputGroup.Root>
								<InputGroup.Input
									{...props}
									bind:value={$formData.invite}
									placeholder="Nutzername"
									class="w-full bg-transparent text-base"
									oninput={checkUsername}
								/>

								<InputGroup.Addon align="block-end" class="text-sm font-normal">
									{#if $delayed}
										<CircleNotchIcon class="animate-spin" />
									{:else if $errors.invite && $formData.invite}
										<div class="flex items-center gap-1 text-error">
											<XIconBold />
											{$errors.invite}
										</div>
									{:else if $formData.invite && 'invite' in $errors}
										<div class="flex items-center gap-1 text-success">
											<CheckFatIcon />
											Nutzer kann eingeladen werden.
										</div>
									{:else}
										<div class="flex items-center gap-1 text-muted">
											<UserCirclePlusIcon />
											Achte auf Groß- und Kleinschreibung!
										</div>
									{/if}

									<Form.Button type="submit" class="ms-auto">Einladung Senden</Form.Button>
								</InputGroup.Addon>
							</InputGroup.Root>
						{/snippet}
					</Form.Control>
				</Form.Field>
			</div>
		</form>

		{#if invitedUsers.length}
			<div class="grid gap-3">
				<div class="text-sm font-medium">Eingeladene Nutzer</div>
				<ul>
					{#each invitedUsers as user (user.id)}
						<li transition:slide={{ axis: 'y', duration: 300 }} class="pb-2 last:pb-0">
							<div
								class="flex items-center gap-1.5 rounded-lg border border-muted/20 bg-surface-high p-3 shadow-sm"
							>
								<EnvelopeDuotoneIcon class="size-5 text-info" />
								<div>
									{user.name}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<form id="check" method="POST" action="?/check" use:submitEnhance>
	<input type="hidden" name="invite" value={$formData.invite} />
</form>
