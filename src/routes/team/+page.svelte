<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let form: ActionData;
	export let data: PageData;
</script>

<main class="prose">
	<h1>Teams</h1>

	<h2>Your teams:</h2>

	{#if data.teams.length}
		<blockquote>Click team for details</blockquote>

		<ul>
			{#each data.teams as team (team.id)}
				<li>
					<a href="/team/{team.id}" class="link link-hover">
						{team.name} | {team.createdAt}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<blockquote>no teams found</blockquote>
	{/if}

	<form
		use:enhance
		method="post"
		action="?/createTeam"
		class="flex flex-col gap-4"
	>
		<h2>Create New Team</h2>

		<div class="form-control w-full max-w-sm">
			<label class="label" for="name">
				<span class="label-text">Team Name</span>
			</label>
			<input
				type="text"
				name="name"
				id="name"
				required
				placeholder="Awesome Team Name"
				class="input input-bordered w-full"
			/>
		</div>

		<div class="form-control w-full max-w-sm">
			<label class="label" for="description">
				<span class="label-text">Description (optional)</span>
			</label>
			<input
				type="text"
				name="description"
				id="description"
				placeholder="What is this team for?"
				class="input input-bordered w-full"
			/>
		</div>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<button type="submit" class="btn btn-secondary mr-auto">Create Team</button>
	</form>
</main>
