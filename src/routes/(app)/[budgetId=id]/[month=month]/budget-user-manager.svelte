<script lang="ts">
	import type { tables } from '$db';

	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { debounce } from '$lib/utils/debounce';
	import { getUserContext } from '$lib/utils/user-context.svelte';
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { cn } from 'tailwind-variants';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';
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

	const user = getUserContext();

	let isOwner = $derived(budgetUsers.some(({ id, role }) => id === user().id && role === 'OWNER'));

	const formInvite = superForm(untrack(() => form));
	const { enhance: inviteEnhance, errors, form: formData } = formInvite;

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

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				{#if budgetUsers.length > 1}
					<UsersThreeIcon class="size-5" />
				{:else}
					<UserCirclePlusIcon class="size-5" />
				{/if}
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-lg gap-0" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>Wer hat Zugriff auf diesen Budgetplan?</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<div>
					Als Ersteller kannst du andere Nutzer einladen, um beim Budgetplan mitzugestalten.
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-6 grid gap-2">
			<div class="text-sm font-medium">Nutzer mit Zugriff</div>
			<ul>
				{#each budgetUsers as user (user.id)}
					<li
						transition:slide={{ axis: 'y', duration: 300 }}
						class="group flex items-center gap-1 rounded-lg px-1 py-1.5 odd:bg-muted/5"
					>
						<UserCircleIcon class="size-5 text-info" />
						<div>
							{user.name}
						</div>

						{#if user.role === 'OWNER'}
							<div class="ml-auto text-info">Hat den Budgetplan erstellt.</div>
						{:else if isOwner}
							<Button
								form="remove"
								type="submit"
								variant="destructive"
								size="xs"
								name="userId"
								value={user.id}
								class="ml-auto opacity-0 group-hover:opacity-100"
							>
								Entfernen
							</Button>
						{/if}
					</li>
				{/each}
			</ul>
		</div>

		{#if invitedUsers.length}
			<div class="grid gap-2 pt-4" transition:slide={{ axis: 'y' }}>
				<div class="text-sm font-medium">Eingeladene Nutzer</div>
				<ul>
					{#each invitedUsers as user (user.id)}
						<li
							transition:slide={{ axis: 'y', duration: 300 }}
							class="group flex items-center gap-1 rounded-lg px-1 py-1.5 odd:bg-muted/5"
						>
							<EnvelopeDuotoneIcon class="size-5 text-info" />
							<div>
								{user.name}
							</div>

							{#if isOwner}
								<Button
									form="remove"
									type="submit"
									variant="destructive"
									size="xs"
									name="userId"
									value={user.id}
									class="ml-auto opacity-0 group-hover:opacity-100"
								>
									Löschen
								</Button>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<Collapsible.Root class="mt-6 space-y-2">
			<Collapsible.Trigger
				class={cn(buttonVariants({ variant: 'ghost' }), 'w-full gap-4 px-0.5 font-medium')}
			>
				Lade andere Nutzer ein

				<div class="h-px grow bg-muted/20"></div>

				<CaretUpDownIcon />
			</Collapsible.Trigger>

			<Collapsible.Content
				class="overflow-hidden px-2 pb-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
			>
				<form method="post" action="?/inviteUser" use:inviteEnhance class="grid gap-2">
					<input type="hidden" name="invite" value={$formData.invite} />

					<div class="rounded-lg bg-error/5 p-3 text-error">
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
			</Collapsible.Content>
		</Collapsible.Root>

		<Dialog.Footer class="mt-6">
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>Schließen</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<form id="remove" action="?/removeUser" method="post" use:enhance></form>

<form id="check" method="POST" action="?/check" use:submitEnhance>
	<input type="hidden" name="invite" value={$formData.invite} />
</form>
