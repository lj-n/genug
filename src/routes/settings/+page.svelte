<script lang="ts">
	import { enhance } from '$app/forms';
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	function reloadAvatar(timestamp: number) {
		const avatars = document.querySelectorAll<HTMLImageElement>(
			'img[src^="/avatar"]'
		);

		avatars.forEach((avatar) => {
			avatar.src = `/avatar?u=${data.user.id}&t=${timestamp}`;
		});
	}
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="my-8 flex items-center gap-4">
	<div class="avatar w-16">
		<img src="/avatar?u={data.user.id}" alt="user-avatar" />
	</div>
	<h1>{data.user.name}</h1>
</div>

<div
	class="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-8"
>
	<div
		class="border-ui flex flex-col items-center gap-2 rounded-lg border p-2 md:gap-4"
	>
		<h2>Profile Image</h2>
		<div class="avatar w-2/3">
			<img src="/avatar?u={data.user.id}" alt="user-avatar" />
		</div>

		<details class="peer">
			<summary class="btn btn-ghost list-none">
				<span>Change Avatar</span>
			</summary>
		</details>

		<form
			action="?/updateAvatar"
			enctype="multipart/form-data"
			method="post"
			class="max-h-0 overflow-hidden transition-all peer-open:max-h-20"
			use:enhance={() => {
				return async ({ update, formElement }) => {
					update();
					reloadAvatar(new Date().getTime());
					formElement.previousElementSibling?.removeAttribute('open');
				};
			}}
		>
			<div class="text-center text-sm text-muted">
				<span>Max file size: 1MB</span>
			</div>

			<div class="flex gap-2 p-2">
				<input
					type="file"
					name="image"
					id="avatar"
					accept="image/*"
					required
					class="peer absolute left-0 top-0 opacity-0"
				/>
				<label
					for="avatar"
					class="btn btn-ghost btn-sm peer-focus:ring-2 peer-focus:ring-orange"
				>
					Select File
				</label>

				<button
					type="submit"
					class="btn btn-green btn-sm peer-invalid:btn-disabled"
				>
					Upload New Avatar
				</button>
			</div>
		</form>

		<form
			action="?/removeAvatar"
			method="post"
			use:enhance={() => {
				return async ({ update }) => {
					update();
					reloadAvatar(new Date().getTime());
				};
			}}
		>
			<button type="submit" class="btn btn-ghost btn-sm text-red">
				<Feather name="trash" />
				Remove Avatar
			</button>
		</form>
	</div>

	<div class="border-ui flex flex-col gap-4 rounded-lg border p-2">
		<h2 class="mx-auto">Settings</h2>

		<form action="?/changeTheme" method="post" class="flex gap-2" use:enhance>
			<span class="text-tx-2 mr-auto">Theme</span>
			<button
				type="submit"
				name="theme"
				value="light"
				class="btn btn-ghost btn-sm"
			>
				<Feather name="sun" />
			</button>

			<button
				type="submit"
				name="theme"
				value="system"
				class="btn btn-ghost btn-sm"
			>
				<Feather name="monitor" />
			</button>

			<button
				type="submit"
				name="theme"
				value="dark"
				class="btn btn-ghost btn-sm"
			>
				<Feather name="moon" />
			</button>
		</form>
	</div>

	<div class="border-ui flex flex-col gap-4 rounded-lg border p-2">
		<h2 class="mx-auto">General</h2>
		<form
			action="?/changeUsername"
			method="post"
			class="mx-auto flex w-full max-w-md flex-col gap-2"
			use:enhance
		>
			<label class="input-label">
				Username
				<input
					type="text"
					name="username"
					class="input"
					value={data.user?.name}
				/>
			</label>

			<button type="submit" class="btn btn-blue ml-auto">
				Change Username
			</button>
		</form>

		<form
			action="?/changePassword"
			method="post"
			class="mx-auto flex w-full max-w-md flex-col gap-2"
			use:enhance
		>
			<label class="input-label">
				Password
				<input
					type="password"
					name="password"
					class="input"
					placeholder="super secret"
				/>
			</label>

			<button type="submit" class="btn btn-orange ml-auto">
				Change Password
			</button>
		</form>
	</div>
</div>
