<script lang="ts">
	import { enhance } from '$app/forms';
	import Feather from '$lib/components/feather.svelte';
	import type { PageData } from './$types';
	export let data: PageData;

	function reloadAvatar() {
		const avatars = document.querySelectorAll(
			'img[src|="/avatar"]'
		) as NodeListOf<HTMLImageElement>;

		avatars.forEach((avatar) => {
			avatar.src = `/avatar?t=${new Date().getTime()}`;
		});
	}
</script>

<div class="flex gap-4 items-center my-8">
	<div class="avatar w-16">
		<img src="/avatar" alt="user-avatar" />
	</div>
	<h1>{data.user?.name}</h1>
</div>

<div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:gap-8">
	<div class="flex flex-col gap-2 md:gap-4 items-center border border-ui rounded-lg p-2">
		<h2>Profile Image</h2>
		<div class="avatar w-2/3">
			<img src="/avatar" alt="user-avatar" />
		</div>

		<details class="peer">
			<summary class="list-none btn btn-ghost">
				<span>Change Avatar</span>
			</summary>
		</details>

		<form
			action="?/updateAvatar"
			method="post"
			class="peer-open:max-h-12 max-h-0 transition-all overflow-hidden"
			use:enhance={() => {
				return async ({ update, formElement }) => {
					update();
					reloadAvatar();
					formElement.previousElementSibling?.removeAttribute('open');
				};
			}}
		>
			<div class="p-2 flex gap-2">
				<input
					type="file"
					name="image"
					id="avatar"
					accept="image/*"
					capture="user"
					required
					class="peer opacity-0 absolute top-0 left-0"
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
					reloadAvatar();
				};
			}}
		>
			<button type="submit" class="btn btn-ghost btn-sm text-red">
				<Feather name="trash" />
				Remove Avatar
			</button>
		</form>
	</div>

	<div class="flex flex-col gap-4 border border-ui rounded-lg p-2">
		<h2 class="mx-auto">Settings</h2>

		<form action="?/changeTheme" method="post" class="flex gap-2" use:enhance>
      <span class="mr-auto text-tx-2">Theme</span>
			<button type="submit" name="theme" value="light" class="btn btn-ghost btn-sm">
				<Feather name="sun" />
			</button>

			<button type="submit" name="theme" value="system" class="btn btn-ghost btn-sm">
				<Feather name="monitor" />
			</button>

			<button type="submit" name="theme" value="dark" class="btn btn-ghost btn-sm">
				<Feather name="moon" />
			</button>
		</form>
	</div>

	<div class="flex flex-col gap-4 border border-ui rounded-lg p-2">
		<h2 class="mx-auto">General</h2>
		<form
			action="?/changeUsername"
			method="post"
			class="max-w-md mx-auto w-full flex flex-col gap-2"
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
			class="max-w-md mx-auto w-full flex flex-col gap-2"
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
