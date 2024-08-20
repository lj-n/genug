<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;
</script>

<svelte:head>
	<title>Teams</title>
</svelte:head>

<h2 class="mb-4 text-2xl font-semibold">Teams</h2>

<div class="md:divide-ui-normal flex flex-col gap-10 md:flex-row md:divide-x">
	<ul role="list" class="w-full space-y-2 md:w-1/4">
		{#each data.teams as { team, role } (team.id)}
			{@const isActiveLink = $page.params.id === team.id.toString()}
			<a
				href="/teams/{team.id}"
				class:border-blue={isActiveLink}
				class:border-ui-normal={!isActiveLink}
				class:hover:fg={!isActiveLink}
				class="group flex flex-col rounded-lg border px-6 py-4"
			>
				<div class="font-semibold">
					<span>{team.name}</span>

					<span class="text-faint text-sm">
						| {role}
					</span>
				</div>
				<span class="text-sm text-muted">{team.description || ''}</span>
			</a>
		{/each}
	</ul>

	<div class="grow pl-10">
		<slot />
	</div>
</div>
