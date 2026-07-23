<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetUsers } from '$lib/remote-functions/budget.remote';
	import { getUser } from '$lib/remote-functions/user.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import UserCirclePlusIcon from '~icons/ph/user-circle-plus';
	import UsersThreeIcon from '~icons/ph/users-three';

	import UserInvitation from './user-invitation.svelte';
	import UserList from './user-list.svelte';

	const budgetId = getBudgetId();

	const budgetUsers = $derived(await getBudgetUsers(budgetId()));
	const user = $derived(await getUser());
	const isOwner = $derived(budgetUsers.some((s) => s.id === user.id && s.role === 'OWNER'));
	const invited = $derived(budgetUsers.filter((f) => f.role === 'INVITEE'));
	const members = $derived(budgetUsers.filter((f) => f.role !== 'INVITEE'));
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon-lg"
				aria-label={m.budget_users_dialog_title()}
				class="bg-muted/10 hover:bg-muted/20"
			>
				{#if budgetUsers.length > 1}
					<UsersThreeIcon class="size-5" />
				{:else}
					<UserCirclePlusIcon class="size-5" />
				{/if}
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="gap-0" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>{m.budget_users_dialog_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<div>
					{m.budget_users_dialog_description()}
				</div>
			</Dialog.Description>
		</Dialog.Header>

		<UserList {isOwner} title={m.budget_users_with_access_title()} users={members} />

		<UserList {isOwner} title={m.budget_users_invited_title()} users={invited} />

		<UserInvitation />

		<Dialog.Footer class="mt-6">
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
