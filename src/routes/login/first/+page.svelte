<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Logo } from '$lib/components/ui/logo';
	import { m } from '$lib/paraglide/messages';
	import { register } from '$lib/remote-functions/auth.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import PhEye from '~icons/ph/eye';
	import PhEyeClosed from '~icons/ph/eye-closed';
	import PhKeyDuotone from '~icons/ph/key-duotone';
	import PhUserCircleDuotone from '~icons/ph/user-circle-duotone';

	let type: 'password' | 'text' = $state('password');

	const submit = createFormSubmit(() => register, { toast: {} });
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

<form class="mx-auto mt-20 grid w-full max-w-sm space-y-6 px-4" {...submit.attrs}>
	<Logo class="mx-auto" href={resolve('/')} />

	<p class="text-center">
		{m.login_admin_introduction()}
	</p>

	<div class="space-y-2">
		<FormField field={register.fields.username} label={m.login_label_username()} hideLabel>
			{#snippet input(field)}
				<InputGroup.Root>
					<InputGroup.Input {...field.as('text')} placeholder={m.login_label_username()} />

					<InputGroup.Addon>
						<PhUserCircleDuotone />
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</FormField>

		<FormField field={register.fields._password} label={m.login_label_password()} hideLabel>
			{#snippet input(field)}
				<InputGroup.Root>
					<InputGroup.Input {...field.as(type)} placeholder={m.login_label_password()} />

					<InputGroup.Addon>
						<PhKeyDuotone />
					</InputGroup.Addon>

					<InputGroup.Addon align="inline-end">
						{@render passwordToggle()}
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</FormField>

		<p class="mt-3 text-center text-base text-muted">
			{m.login_admin_credentials_info()}
		</p>
	</div>

	<Button type="submit" class="mx-auto" loading={submit.pending} {@attach submit.anchor}>
		{m.login_admin_button()}
	</Button>
</form>
