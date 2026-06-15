<script lang="ts">
	import type { BudgetUser } from '$db/budget.utils';

	import { m } from '$lib/paraglide/messages';
	import { removeUser } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { slide } from 'svelte/transition';
	import EnvelopeDuotoneIcon from '~icons/ph/envelope-duotone';
	import UserCircleIcon from '~icons/ph/user-circle';

	import { Button } from '../ui/button';

	type UserListProps = {
		isOwner: boolean;
		title: string;
		users: BudgetUser[];
	};

	let { isOwner, title, users }: UserListProps = $props();

	const budgetId = getBudgetId();
</script>

{#if users.length > 0}
	<div class="grid gap-2 py-3" transition:slide={{ axis: 'y', duration: 200 }}>
		<div class="text-sm font-medium">{title}</div>

		<ul>
			{#each users as user (user.id)}
				<li
					transition:slide={{ axis: 'y', duration: 200 }}
					class="group flex items-center gap-1 rounded-lg px-1 py-1.5 odd:bg-muted/5"
				>
					{#if user.role === 'INVITEE'}
						<EnvelopeDuotoneIcon class="size-5 text-info" />
					{:else}
						<UserCircleIcon class="size-5 text-info" />
					{/if}

					<span>{user.name}</span>

					{#if user.role === 'OWNER'}
						<div class="ml-auto text-info">{m.budget_users_creator_label()}</div>
					{:else if isOwner}
						{@const form = removeUser.for(user.id)}
						<form {...form} class="contents">
							<input {...form.fields.userId.as('hidden', user.id)} />
							<input {...form.fields.budgetId.as('hidden', budgetId())} />
							<Button
								type="submit"
								variant="destructive"
								size="xs"
								class="ml-auto opacity-0 group-hover:opacity-100"
							>
								{m.budget_users_remove_button()}
							</Button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}
