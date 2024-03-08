<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/button.svelte';
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let searchValue = data.query || '';
	$: if (browser) {
		goto(`?query=${searchValue}`, { keepFocus: true });
	}
</script>

<svelte:head>
	<title>Teams | {data.team.name}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<a href="/team" class="btn btn-sm w-fit mr-auto">
		<Feather name="arrow-left" />
		Go Back
	</a>

	<h1 class="mt-4 font-bold text-3xl">{data.team.name}</h1>
	<p class="text-muted mb-8">{data.team.description}</p>

	<div class="flex w-full">
		<div class="w-1/3 flex flex-col gap-2">
			<h2 class="text-xl font-semibold mx-auto">Users</h2>

			{#each data.team.members as member (member.user.id)}
				<div class="flex gap-4 items-center p-2 rounded-xl fg text-sm">
					<div class="avatar w-12">
						<img src="/avatar?u={member.user.id}" alt="User Avatar" />
					</div>
					<div class="flex flex-col">
						<span class="font-semibold">
							{member.user.name}
							{#if member.user.id === data.user?.id}
								<span class="font-normal text-muted">(You)</span>
							{/if}
						</span>
						<span class="text-muted text-xs">{member.role}</span>
					</div>
				</div>
			{/each}
		</div>

		<div class="w-2/3 pl-8 flex flex-col gap-2">
			{#if data.role === 'OWNER'}
				<form data-sveltekit-keepfocus class="flex flex-col">
					<h2 class="text-xl font-semibold mx-auto mb-2">
						Search & Invite Users
					</h2>

					<div class="flex items-end gap-2">
						<label class="input-label text-sm">
							Search Users by Name
							<input
								type="text"
								name="query"
								id="query"
								class="input"
								bind:value={searchValue}
								autocomplete="off"
							/>
						</label>

						<Button type="submit" class="btn btn-orange" icon="search">
							Search
						</Button>
					</div>
				</form>

				{#if data.searchResult}
					{#if data.searchResult.length === 0}
						<p class="text-sm text-muted mx-auto">
							No users found with the given query.
						</p>
					{:else}
						<span class="text-sm text-muted mx-auto">Found Users:</span>
					{/if}

					{#each data.searchResult as foundUser (foundUser.id)}
						<form
							action="?/invite"
							method="post"
							use:enhance
							class="flex gap-2 p-1 items-center w-full rounded-xl fg"
						>
							<input type="hidden" name="userId" value={foundUser.id} />

							<div class="avatar w-8">
								<img src="/avatar?u={foundUser.id}" alt="User Avatar" />
							</div>

							<span class="font-semibold text-sm">{foundUser.name}</span>

							<Button class="btn btn-sm btn-cyan ml-auto" icon="user-plus">
								Invite
							</Button>
						</form>
					{/each}
				{/if}

				<form
					action="?/update"
					method="post"
					use:enhance
					class="flex flex-col gap-2 mt-12"
				>
					<h2 class="text-xl font-semibold mx-auto mb-2">
						Update Team Information
					</h2>

					<label class="input-label text-sm">
						Name
						<input
							type="text"
							name="name"
							id="name"
							class="input"
							value={data.team.name}
						/>
					</label>

					<label class="input-label text-sm">
						Description
						<input
							type="text"
							name="name"
							id="name"
							class="input"
							value={data.team.description}
						/>
					</label>

					<Button
						type="submit"
						class="btn btn-orange ml-auto"
						icon="chevrons-right"
					>
						Update
					</Button>
				</form>
			{/if}
		</div>
	</div>
</div>
