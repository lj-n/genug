<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
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

<ResponsiveModal.Root dismissible={false}>
	<ResponsiveModal.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" aria-label={m.budget_users_dialog_title()}>
				{#if budgetUsers.length > 1}
					<UsersThreeIcon />
				{:else}
					<UserCirclePlusIcon />
				{/if}
			</Button>
		{/snippet}
	</ResponsiveModal.Trigger>

	<ResponsiveModal.Content class="gap-0">
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.budget_users_dialog_title()}</ResponsiveModal.Title>
			<ResponsiveModal.Description class="grid gap-4">
				<div>
					{m.budget_users_dialog_description()}
				</div>
			</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<UserList {isOwner} title={m.budget_users_with_access_title()} users={members} />

			<UserList {isOwner} title={m.budget_users_invited_title()} users={invited} />

			<UserInvitation />
		</ResponsiveModal.Body>

		<ResponsiveModal.Footer class="mt-6">
			<ResponsiveModal.Close class={buttonVariants({ variant: 'ghost' })}>
				{m.dialog_close()}
			</ResponsiveModal.Close>
		</ResponsiveModal.Footer>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
