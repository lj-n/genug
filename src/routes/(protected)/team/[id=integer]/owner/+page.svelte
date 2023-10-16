<script lang="ts">
	import type { schema } from '$lib/server';
	import type { PageData } from './$types';
	import MemberSettings from './member.settings.svelte';

	export let data: PageData;

	function sortByRole(
		a: (typeof data.teamMembers)[number],
		b: (typeof data.teamMembers)[number]
	) {
		const roleOrder = { OWNER: 1, MEMBER: 2, INVITED: 3 };
		return roleOrder[a.role] - roleOrder[b.role];
	}
</script>

<div class="overflow-x-auto">
	<table class="table table-zebra">
		<thead>
			<tr>
				<th>Name</th>
				<th>Email</th>
				<th>Role</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.teamMembers.sort(sortByRole) as member (member.userId)}
				{@const isCurrentUser = member.userId === data.user.userId}
				<tr>
					{#if isCurrentUser}
						<td>{member.name} (You)</td>
					{:else}
						<td>{member.name}</td>
					{/if}

					<td>{member.email}</td>

					<td>{member.role}</td>

					<td>
						{#if !isCurrentUser}
							<MemberSettings userId={member.userId} role={member.role} />
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<form class="indicator p-4 mt-20 border border-red-400" method="post" action="?/deleteTeam">
	<span class="indicator-item badge badge-error">danger</span>
	<button type="submit" class="btn btn-sm">delete team</button>
</form>
