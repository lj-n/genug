<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button } from '$lib/components/ui/button';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { m } from '$lib/paraglide/messages';
	import {
		acceptInvite,
		getBudgets,
		getInvitations,
		removeUser
	} from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import EnvelopeDuotoneIcon from '~icons/ph/envelope-duotone';

	type Invitation = Awaited<ReturnType<typeof getInvitations>>[number];

	let { invitation }: { invitation: Invitation } = $props();

	let open = $state(false);

	const user = $derived(await getUser());

	const acceptSubmit = createFormSubmit(() => acceptInvite, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		// Drop the nav invitation indicator and surface the newly-joined budget,
		// both without a reload (see docs/dev/remote-functions.md).
		updates: () => [getInvitations(), getBudgets()]
	});
</script>

<ResponsiveModal.Root bind:open dismissible={false}>
	<ResponsiveModal.Trigger>
		{#snippet child({ props })}
			<Button {...props} class="mt-6 w-full">
				<EnvelopeDuotoneIcon class="size-6 animate-pulse" />
				<span class="font-semibold">{m.invitation_button_label()}</span>
			</Button>
		{/snippet}
	</ResponsiveModal.Trigger>

	<ResponsiveModal.Content class="sm:max-w-md">
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.invitation_dialog_title()}</ResponsiveModal.Title>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<p>
				<ParaglideMessage
					message={m.invitation_dialog_description}
					inputs={{ budgetName: invitation.budgetName ?? '', inviterName: invitation.inviterName }}
				>
					{#snippet b({ children })}
						<b>{@render children?.()}</b>
					{/snippet}
				</ParaglideMessage>
			</p>
		</ResponsiveModal.Body>

		<ResponsiveModal.Footer>
			<AlertDialogForm
				form={removeUser}
				onSuccess={() => {
					open = false;
				}}
				updates={() => [getInvitations()]}
			>
				{#snippet trigger(props)}
					<Button {...props} variant="ghost">{m.invitation_decline_button()}</Button>
				{/snippet}

				{#snippet header()}
					<AlertDialog.Title>{m.invitation_decline_confirm_title()}</AlertDialog.Title>
					<AlertDialog.Description>
						{m.invitation_decline_confirm_description()}
					</AlertDialog.Description>
				{/snippet}

				{#snippet fields()}
					<input {...removeUser.fields.budgetId.as('hidden', invitation.budgetId)} />
					<input {...removeUser.fields.userId.as('hidden', user.id)} />
				{/snippet}

				{#snippet footer({ formId, pending })}
					<Button type="submit" form={formId} variant="destructive" loading={pending}>
						{m.invitation_decline_confirm_action()}
					</Button>
				{/snippet}
			</AlertDialogForm>

			<form class="contents" {...acceptSubmit.attrs}>
				<input {...acceptInvite.fields.budgetId.as('hidden', invitation.budgetId)} />
				<Button
					type="submit"
					name="userId"
					value={user.id}
					loading={acceptSubmit.pending}
					{@attach acceptSubmit.anchor}
				>
					{m.invitation_accept_button()}
				</Button>
			</form>
		</ResponsiveModal.Footer>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
