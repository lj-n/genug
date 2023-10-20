<script lang="ts">
	import { enhance } from '$app/forms';
  import OwnerActions from './owner.actions.svelte'
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	function sortByRole(
		a: (typeof data.team.member)[number],
		b: (typeof data.team.member)[number]
	) {
		const roleOrder = { OWNER: 1, MEMBER: 2, INVITED: 3 };
		return roleOrder[a.role] - roleOrder[b.role];
	}
</script>

<main class="w-full prose flex flex-col gap-4">
  <h1>{data.team.name}</h1>

	{#if data.userRole === 'INVITED'}
		<p>
			You've been invited to join the team:
			<span class="italic mx-2">{data.team.name}</span>
    </p>

		<form method="post" use:enhance>
			<input type="hidden" name="userId" value={data.user?.userId} />
			<button
				formaction="?/acceptInvitation"
				type="submit"
				class="btn btn-secondary">Accept Invitation</button
			>
			<button
				formaction="?/cancelInvitation"
				type="submit"
				class="btn btn-secondary">Cancel Invitation</button
			>
		</form>
	{:else}
    <h2>Team member</h2>

		<div class="overflow-x-auto">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th>Name</th>
						<th>Role</th>
						{#if data.userRole === 'OWNER'}
							<th>Actions</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.team.member.sort(sortByRole) as member (member.user.id)}
						{@const isCurrentUser = member.user.id === data.user?.userId}
						<tr>
							{#if isCurrentUser}
								<td>{member.user.name} (You)</td>
							{:else}
								<td>{member.user.name}</td>
							{/if}

							<td>{member.role}</td>

							{#if !isCurrentUser && data.userRole === 'OWNER'}
								<td>
									<OwnerActions userId={member.user.id} role={member.role} />
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if data.userRole === 'OWNER'}
		<h2>Invite Users to team</h2>

		<form method="POST" action="?/searchUser" use:enhance>
			<div class="form-control w-full max-w-xs">
				<label class="label" for="query">
					<span class="label-text">Search user by name or id</span>
				</label>

				<div class="join">
					<input
						class="input input-sm input-bordered join-item"
						type="text"
						placeholder="type name here"
						id="query"
						name="query"
					/>
					<button type="submit" class="btn btn-sm btn-accent join-item">
						search users
					</button>
				</div>
			</div>
		</form>
		{#if form?.foundUsers}
			{#each form.foundUsers as foundUser (foundUser.id)}
				<form method="POST" action="?/inviteUser" use:enhance>
					<input type="hidden" name="userId" id="userId" value={foundUser.id} />

					<div class="flex justify-between">
						<span>{foundUser.name}</span>
						<button type="submit" class="btn btn-sm">Invite User</button>
					</div>
				</form>
			{/each}
		{/if}
	{/if}

	{#if form?.error}
		<p>{form.error}</p>
	{/if}
</main>
