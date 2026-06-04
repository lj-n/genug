<script lang="ts">
	import Logo from '$lib/components/logo.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { register } from '$lib/remote-functions/auth.remote';
	import PhEye from '~icons/ph/eye';
	import PhEyeClosed from '~icons/ph/eye-closed';
	import PhKeyDuotone from '~icons/ph/key-duotone';
	import PhUserCircleDuotone from '~icons/ph/user-circle-duotone';

	let type: 'password' | 'text' = $state('password');
</script>

{#snippet passwordToggle()}
	<InputGroup.Button
		onclick={() => (type = type === 'password' ? 'text' : 'password')}
		class="size-6 p-0 text-foreground [&_svg:not([class*='size-'])]:size-4"
	>
		{#if type === 'password'}
			<PhEyeClosed />
			<span class="sr-only">{m.login_hide_password()}</span>
		{:else}
			<PhEye />
			<span class="sr-only">{m.login_show_password()}</span>
		{/if}
	</InputGroup.Button>
{/snippet}

<form
	class="mx-auto mt-20 grid w-full max-w-sm space-y-6 rounded-lg bg-muted/5 p-3 py-6"
	{...register}
>
	<Logo class="mx-auto mt-auto w-52" aria-hidden />

	<p class="text-center">
		{m.login_admin_introduction()}
	</p>

	<div class="space-y-2">
		<InputGroup.Root>
			<InputGroup.Input
				{...register.fields.username.as('text')}
				aria-label={m.login_label_username()}
				placeholder={m.login_label_username()}
			/>

			<InputGroup.Addon>
				<PhUserCircleDuotone />
			</InputGroup.Addon>
		</InputGroup.Root>

		<InputGroup.Root>
			<InputGroup.Input
				{...register.fields._password.as(type)}
				aria-label={m.login_label_password()}
				placeholder={m.login_label_password()}
			/>

			<InputGroup.Addon>
				<PhKeyDuotone />
			</InputGroup.Addon>

			<InputGroup.Addon align="inline-end">
				{@render passwordToggle()}
			</InputGroup.Addon>
		</InputGroup.Root>

		{#each register.fields.allIssues() as issue (issue)}
			<p class="text-error">{issue.message}</p>
		{/each}

		<p class="mt-3 rounded-md bg-info/5 p-2 text-center text-base text-info">
			{m.login_admin_credentials_info()}
		</p>
	</div>

	<Button type="submit" class="mx-auto">{m.login_admin_button()}</Button>
</form>
