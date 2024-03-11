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

<a href="/team" class="btn btn-sm w-fit mr-auto">
	<Feather name="arrow-left" />
	Go Back
</a>

<h1 class="mt-8 font-bold text-3xl">{data.team.name}</h1>
<p class="text-muted text-lg mt-2">
	{data.team.description}
</p>

{#if data.role === 'INVITED'}
	<div class="flex flex-col gap-4 mt-8">
		<p class="text-lg">You have been invited to join this team.</p>

		<form action="?/accept" method="post" use:enhance class="flex gap-2">
			<Button type="submit" class="btn btn-sm btn-green" icon="heart">
				Accept
			</Button>

			<Button formaction="?/decline" class="btn btn-sm btn-red" icon="frown">
				Decline
			</Button>
		</form>
	</div>
{/if}

<div class="my-12">
	{#each data.team.members as member (member.user.id)}
		<div
			class="border-t border-ui-normal py-2 flex gap-2 items-center last:border-y"
		>
			<div class="avatar w-10">
				<img src="/avatar?u={member.user.id}" alt="User Avatar" />
			</div>
			<div class="flex flex-col">
				<span>
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

{#if data.role === 'OWNER'}
	<details
		class="group fg rounded-xl border border-ui-normal open:(border-orange bg) p-4"
	>
		<summary class="list-none flex gap-2 cursor-pointer select-none">
			<Feather
				name="chevron-down"
				class="hidden group-open:block text-lg text-orange"
			/>
			<Feather name="chevron-right" class="block group-open:hidden text-lg" />
			<span class="font-semibold">Update Team Information</span>
		</summary>

		<form
			action="?/update"
			method="post"
			use:enhance
			class="grid grid-cols-2 gap-2 mt-4"
		>
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
				class="btn btn-orange ml-auto col-span-2"
				icon="chevrons-right"
			>
				Update
			</Button>
		</form>
	</details>

	<details
		class="group fg rounded-xl border border-ui-normal open:(border-orange bg) mt-4 p-4"
	>
		<summary class="list-none flex gap-2 cursor-pointer select-none">
			<Feather
				name="chevron-down"
				class="hidden group-open:block text-lg text-orange"
			/>
			<Feather name="chevron-right" class="block group-open:hidden text-lg" />
			<span class="font-semibold">Invite Users</span>
		</summary>

		<form data-sveltekit-keepfocus class="flex flex-col max-w-lg mx-auto mt-4">
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
			<p class="text-xs text-muted text-center my-2">
				{#if data.searchResult.length === 0}
					No users found with the given query.
				{:else}
					Found Users:
				{/if}
			</p>

			<ul role="list" class="space-y-2">
				{#each data.searchResult as foundUser (foundUser.id)}
					<form
						action="?/invite"
						method="post"
						use:enhance
						class="flex gap-2 p-1 items-center w-full rounded-xl fg w-full mx-auto max-w-xs"
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
			</ul>
		{/if}
	</details>
{/if}
