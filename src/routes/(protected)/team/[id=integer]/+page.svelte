<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<main class="w-fit flex flex-col gap-4">
	<h1>Team page</h1>

	<pre>{JSON.stringify(data, null, 2)}</pre>

	{#if data.user.role === 'INVITED'}
		<form action="?/userconfirm" method="POST" use:enhance>
			<input type="hidden" name="userId" value={data.user.userId} />
			<button type="submit" class="btn btn-secondary">Accept Invite</button>
		</form>
	{/if}

	{#if data.user.role === 'OWNER'}
		<form method="POST" action="?/usersearch" use:enhance>
			<div class="form-control w-full max-w-xs">
				<label class="label" for="email">
					<span class="label-text">Invite user per email</span>
				</label>

				<div class="join">
					<input
						class="input input-sm input-bordered join-item"
						type="text"
						placeholder="type email here"
						id="email"
						name="email"
					/>
					<button type="submit" class="btn btn-sm btn-accent join-item">
						search users
					</button>
				</div>
			</div>
		</form>
		{#if form?.foundUser}
			<form method="POST" action="?/userinvite" use:enhance>
				<input
					type="hidden"
					name="userId"
					id="userId"
					value={form.foundUser.id}
				/>

				<div class="flex justify-between">
					<span>{form.foundUser.name}</span>
					<button type="submit" class="btn btn-sm">Invite User</button>
				</div>
			</form>
		{/if}
	{/if}

	{#if form?.error}
		<p>{form.error}</p>
	{/if}
</main>
