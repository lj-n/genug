<script lang="ts">
	import type { tables } from '$db';

	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { debounce } from '$lib/utils/debounce';
	import { getUserContext } from '$lib/utils/user-context';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
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

	import type { schemaInviteUser } from '../schema';

	type Role = typeof tables.usersToBudgets.$inferSelect.role;

	let {
		form,
		users
	}: {
		form: SuperValidated<Infer<typeof schemaInviteUser>>;
		users: { id: string; name: string; role: Role }[];
	} = $props();

	const budget = getBudgetContext();
	const { id: budgetId } = budget();

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
			<Dialog.Title>{m.budget_users_dialog_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<div>
					{m.budget_users_dialog_description()}
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-6 grid gap-2">
			<div class="text-sm font-medium">{m.budget_users_with_access_title()}</div>
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
							<div class="ml-auto text-info">{m.budget_users_creator_label()}</div>
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
								{m.budget_users_remove_button()}
							</Button>
						{/if}
					</li>
				{/each}
			</ul>
		</div>

		{#if invitedUsers.length}
			<div class="grid gap-2 pt-4" transition:slide={{ axis: 'y' }}>
				<div class="text-sm font-medium">{m.budget_users_invited_title()}</div>
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
									{m.delete()}
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
				{m.budget_users_invite_trigger()}

				<div class="h-px grow bg-muted/20"></div>

				<CaretUpDownIcon />
			</Collapsible.Trigger>

			<Collapsible.Content
				class="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
			>
				<form
					method="post"
					action={resolve(`/(app)/[budgetId=id]?/inviteUser`, { budgetId })}
					use:inviteEnhance
					class="grid gap-2"
				>
					<input type="hidden" name="invite" value={$formData.invite} />

					<div class="rounded-lg bg-info/5 p-3 text-sm text-info">
						<ParaglideMessage message={m.budget_users_invite_warning} inputs={{}}>
							{#snippet b({ children })}
								<b>{@render children?.()}</b>
							{/snippet}
						</ParaglideMessage>
					</div>

					<div class="flex w-full items-center gap-2 rounded-lg bg-muted/5 p-3">
						<Form.Field form={formInvite} name="invite" class="w-full">
							<Form.Control>
								{#snippet children({ props })}
									<InputGroup.Root>
										<InputGroup.Input
											{...props}
											bind:value={$formData.invite}
											placeholder={m.admin_input_placeholder_username()}
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
													{m.budget_users_invite_success()}
												</div>
											{:else}
												<div class="flex items-center gap-1 text-muted">
													<UserCirclePlusIcon />
													{m.budget_users_username_case_hint()}
												</div>
											{/if}

											<Form.Button type="submit" class="ms-auto"
												>{m.budget_users_invite_button()}</Form.Button
											>
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
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<form
	id="remove"
	action={resolve(`/(app)/[budgetId=id]?/removeUser`, { budgetId })}
	method="post"
	use:enhance
></form>

<form
	id="check"
	method="POST"
	action={resolve(`/(app)/[budgetId=id]?/checkUser`, { budgetId })}
	use:submitEnhance
>
	<input type="hidden" name="invite" value={$formData.invite} />
</form>
