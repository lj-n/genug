<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { InputPassword } from '$lib/components/ui/input-password';
	import { Logo } from '$lib/components/ui/logo';
	import { SourceLink } from '$lib/components/ui/source-link';
	import { m } from '$lib/paraglide/messages';
	import { login } from '$lib/remote-functions/auth.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import PhUserCircleDuotone from '~icons/ph/user-circle-duotone';

	const submit = createFormSubmit(() => login, { toast: {} });
</script>

<form class="mx-auto mt-20 grid w-full max-w-sm space-y-6" {...submit.attrs}>
	<Logo class="mx-auto mt-auto w-52" aria-hidden />

	<div class="grid space-y-2 rounded-lg bg-muted/5 p-3">
		<FormField field={login.fields.username} label={m.login_label_username()} hideLabel>
			{#snippet input(field)}
				<InputGroup.Root>
					<InputGroup.Input {...field.as('text')} placeholder={m.login_label_username()} />

					<InputGroup.Addon>
						<PhUserCircleDuotone />
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</FormField>

		<FormField field={login.fields._password} label={m.login_label_password()} hideLabel>
			{#snippet input(field)}
				<InputPassword {...field.as('password')} placeholder={m.login_label_password()} />
			{/snippet}
		</FormField>

		<!-- Wrong credentials arrive as a form-level issue (no field path), so they
		     render here instead of at a field. -->
		{#each login.fields.issues() as issue (issue)}
			<p class="text-error" role="alert">{issue.message}</p>
		{/each}

		<Button type="submit" class="ml-auto" loading={submit.pending} {@attach submit.anchor}>
			{m.login_button()}
		</Button>
	</div>
</form>

<SourceLink class="mx-auto mt-6 block w-fit" />
