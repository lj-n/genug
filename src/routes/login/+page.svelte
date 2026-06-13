<script lang="ts">
	import Logo from '$lib/components/logo.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { InputPassword } from '$lib/components/ui/input-password';
	import { m } from '$lib/paraglide/messages';
	import { login } from '$lib/remote-functions/auth.remote';
	import PhUserCircleDuotone from '~icons/ph/user-circle-duotone';
</script>

<form class="mx-auto mt-20 grid w-full max-w-sm space-y-6" {...login}>
	<Logo class="mx-auto mt-auto w-52" aria-hidden />

	<div class="grid space-y-2 rounded-lg bg-muted/5 p-3">
		<InputGroup.Root>
			<InputGroup.Input
				{...login.fields.username.as('text')}
				placeholder={m.login_label_username()}
				aria-label={m.login_label_username()}
			/>

			<InputGroup.Addon>
				<PhUserCircleDuotone />
			</InputGroup.Addon>
		</InputGroup.Root>

		<InputPassword
			{...login.fields._password.as('password')}
			placeholder={m.login_label_password()}
			aria-label={m.login_label_password()}
		/>

		{#each login.fields.allIssues() as issue (issue)}
			<p class="text-error">{issue.message}</p>
		{/each}

		<Button type="submit" class="ml-auto">{m.login_button()}</Button>
	</div>
</form>
