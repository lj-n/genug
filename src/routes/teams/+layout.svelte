<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;
</script>

<svelte:head>
	<title>Teams</title>
</svelte:head>

<h2 class="mb-4 font-semibold text-2xl">Teams</h2>

<div class="flex flex-col md:flex-row gap-10 md:divide-x md:divide-ui-normal">
	<ul role="list" class="w-full md:w-1/4 space-y-2">
		{#each data.teams as { team, role } (team.id)}
			{@const isActiveLink = $page.params.id === team.id.toString()}
			<a
				href="/teams/{team.id}"
				class:border-blue={isActiveLink}
				class:border-ui-normal={!isActiveLink}
				class:hover:fg={!isActiveLink}
				class="group flex flex-col py-4 px-6 border rounded-lg"
			>
				<div class="font-semibold">
					<span>{team.name}</span>

					<span class="text-sm text-faint">
						| {role}
					</span>
				</div>
				<span class="text-muted text-sm">{team.description || ''}</span>
			</a>
		{/each}
	</ul>

	<div class="grow pl-10">
		<slot />
	</div>
</div>
