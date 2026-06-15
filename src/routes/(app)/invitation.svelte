<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import EnvelopeDuotoneIcon from '~icons/ph/envelope-duotone';

	type Invitation = ReturnType<typeof import('$db').actions.budget.getBudgetInvitations>[number];

	let { invitation }: { invitation: Invitation } = $props();

	let open = $state(false);

	const user = $derived(await getUser());
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
				action={resolve(`/(app)/[budgetId=id]?/removeUser`, { budgetId: invitation.budgetId })}
				method="post"
				class="contents"
				use:enhance
			>
				<Button variant="ghost" type="submit" name="userId" value={user.id}
					>{m.invitation_decline_button()}</Button
				>
			</form>

			<form
				action={resolve(`/(app)/[budgetId=id]?/acceptInvite`, { budgetId: invitation.budgetId })}
				method="post"
				class="contents"
				use:enhance
			>
				<Button type="submit" name="userId" value={user.id}>{m.invitation_accept_button()}</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
