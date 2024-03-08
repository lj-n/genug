<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Teams</title>
</svelte:head>

<h2 class="mb-4 font-semibold text-2xl">Teams</h2>

<div class="flex divide-x divide-ui-normal gap-4">
	<ul role="list" class="w-1/4 divide-y divide-ui-normal">
		{#each data.teams as { team, role } (team.id)}
			<div class="flex flex-col max-w-md py-4 first:pt-0 last:pb-0">
				<h2 class="font-semibold">
					{team.name}
					<span class="text-faint text-sm">| {role}</span>
				</h2>

				<p>{team.description}</p>

				{#if role === 'INVITED'}
					<p class="my-2 text-sm text-muted">
						You were invited to join this team.
					</p>

					<form
						action="/team?/accept"
						method="post"
						use:enhance
						class="flex gap-2 mx-auto"
					>
						<input type="hidden" name="teamId" value={team.id} />

						<Button type="submit" class="btn btn-sm btn-green" icon="heart">
							Accept
						</Button>

						<Button
							formaction="?/decline"
							class="btn btn-sm btn-red"
							icon="frown"
						>
							Decline
						</Button>
					</form>
				{:else}
					<a href="/team/{team.id}" class="btn btn-yellow btn-sm ml-auto mt-2">
						<Feather name="arrow-right" />
						More Details
					</a>
				{/if}
			</div>
		{/each}
	</ul>

	<div class="grow pl-8">
		<slot />
	</div>
</div>
