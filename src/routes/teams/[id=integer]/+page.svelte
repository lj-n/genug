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

<a href="/teams" class="btn btn-sm mr-auto w-fit">
	<Feather name="arrow-left" />
	Go Back
</a>

<h1 class="mt-8 text-3xl font-bold">{data.team.name}</h1>
<p class="mt-2 text-lg text-muted">
	{data.team.description}
</p>

{#if data.role === 'INVITED'}
	<div class="mt-8 flex flex-col gap-4">
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
			class="border-ui-normal flex items-center gap-2 border-t py-2 last:border-y"
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
				<span class="text-xs text-muted">{member.role}</span>
			</div>
		</div>
	{/each}
</div>

{#if data.role === 'OWNER'}
	<details
		class="fg border-ui-normal open:(border-orange bg) group rounded-xl border p-4"
	>
		<summary class="flex cursor-pointer select-none list-none gap-2">
			<Feather
				name="chevron-down"
				class="hidden text-lg text-orange group-open:block"
			/>
			<Feather name="chevron-right" class="block text-lg group-open:hidden" />
			<span class="font-semibold">Update Team Information</span>
		</summary>

		<form
			action="?/update"
			method="post"
			use:enhance
			class="mt-4 grid grid-cols-2 gap-2"
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
				class="btn btn-orange col-span-2 ml-auto"
				icon="chevrons-right"
			>
				Update
			</Button>
		</form>
	</details>

	<details
		class="fg border-ui-normal open:(border-orange bg) group mt-4 rounded-xl border p-4"
	>
		<summary class="flex cursor-pointer select-none list-none gap-2">
			<Feather
				name="chevron-down"
				class="hidden text-lg text-orange group-open:block"
			/>
			<Feather name="chevron-right" class="block text-lg group-open:hidden" />
			<span class="font-semibold">Invite Users</span>
		</summary>

		<form data-sveltekit-keepfocus class="mx-auto mt-4 flex max-w-lg flex-col">
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
			<p class="my-2 text-center text-xs text-muted">
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
						class="fg mx-auto flex w-full w-full max-w-xs items-center gap-2 rounded-xl p-1"
					>
						<input type="hidden" name="userId" value={foundUser.id} />

						<div class="avatar w-8">
							<img src="/avatar?u={foundUser.id}" alt="User Avatar" />
						</div>

						<span class="text-sm font-semibold">{foundUser.name}</span>

						<Button class="btn btn-sm btn-cyan ml-auto" icon="user-plus">
							Invite
						</Button>
					</form>
				{/each}
			</ul>
		{/if}
	</details>
{/if}
