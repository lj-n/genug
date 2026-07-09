<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { acceptInvite, getInvitations, removeUser } from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import EnvelopeDuotoneIcon from '~icons/ph/envelope-duotone';

	type Invitation = Awaited<ReturnType<typeof getInvitations>>[number];

	let { invitation }: { invitation: Invitation } = $props();

	let open = $state(false);

	const userQuery = getUser();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} class="mt-6 w-full">
				<EnvelopeDuotoneIcon class="size-6 animate-pulse" />
				<span class="font-semibold">{m.invitation_button_label()}</span>
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-md" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>{m.invitation_dialog_title()}</Dialog.Title>
		</Dialog.Header>

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

		<Dialog.Footer>
			<form
				class="contents"
				{...removeUser.enhance(async (f) => {
					if (await f.submit()) open = false;
				})}
			>
				<input {...removeUser.fields.budgetId.as('hidden', invitation.budgetId)} />
				<Button variant="ghost" type="submit" name="userId" value={(await userQuery).id}
					>{m.invitation_decline_button()}</Button
				>
			</form>

			<form
				class="contents"
				{...acceptInvite.enhance(async (f) => {
					if (await f.submit()) open = false;
				})}
			>
				<input {...acceptInvite.fields.budgetId.as('hidden', invitation.budgetId)} />
				<Button type="submit" name="userId" value={(await userQuery).id}
					>{m.invitation_accept_button()}</Button
				>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
