<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { getUserContext } from '$lib/utils/user-context.svelte';
	import EnvelopeDuotoneIcon from '~icons/ph/envelope-duotone';

	type Invitation = ReturnType<App.Actions['budget']['getInvitations']>[number];

	let { invitation }: { invitation: Invitation } = $props();

	let open = $state(false);

	const user = getUserContext();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} class="mt-6 w-full">
				<EnvelopeDuotoneIcon class="size-6 animate-pulse" />
				<span class="font-semibold">Du hast eine Einladung</span>
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-md" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>Du wurdest eingeladen!</Dialog.Title>
		</Dialog.Header>

		<p>
			{invitation.inviterName}
			möchte dir Zugriff auf den Budgetplan
			<b>
				{invitation.budgetName}
			</b>
			geben.
		</p>

		<Dialog.Footer>
			<form
				action={resolve(`/(app)/[budgetId=id]?/removeUser`, { budgetId: invitation.budgetId })}
				method="post"
				class="contents"
				use:enhance
			>
				<Button variant="ghost" type="submit" name="userId" value={user().id}>Ablehnen</Button>
			</form>

			<form
				action={resolve(`/(app)/[budgetId=id]?/acceptInvite`, { budgetId: invitation.budgetId })}
				method="post"
				class="contents"
				use:enhance
			>
				<Button type="submit" name="userId" value={user().id}>Annehmen</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
