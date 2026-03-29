<script lang="ts">
	import type { PageProps } from './$types';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import Logo from '$lib/components/logo.svelte';

	import { superForm } from 'sveltekit-superforms';
	import { untrack } from 'svelte';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { schema } from './schema';

	import PhUserCircleDuotone from '~icons/ph/user-circle-duotone';
	import PhKeyDuotone from '~icons/ph/key-duotone';
	import PhEyeClosed from '~icons/ph/eye-closed';
	import PhEye from '~icons/ph/eye';

	let { data }: PageProps = $props();

	let action = $derived(data.isFirstUser ? '?/firstUser' : '?/login');
	let buttonText = $derived(data.isFirstUser ? 'Create Admin User' : 'Login');

	const form = superForm(
		untrack(() => data.form),
		{ validators: zod4Client(schema) }
	);

	const { enhance, form: formData } = form;

	let type: 'password' | 'text' = $state('password');
</script>

{#snippet passwordToggle()}
	<InputGroup.Button
		onclick={() => (type = type === 'password' ? 'text' : 'password')}
		class="size-6 p-0 text-foreground [&_svg:not([class*='size-'])]:size-4"
	>
		{#if type === 'password'}
			<PhEyeClosed />
		{:else}
			<PhEye />
		{/if}
	</InputGroup.Button>
{/snippet}

<form {action} method="POST" use:enhance class="mx-auto mt-12 grid max-w-sm space-y-6">
	<Logo class="mx-auto w-52" aria-hidden />

	{#if data.isFirstUser}
		<p class="text-center">
			Let's get started by creating the first user. This user will be the administrator of this
			genug-instance.
		</p>
	{/if}

	<div class="space-y-2">
		<Form.Field {form} name="username">
			<Form.Control>
				{#snippet children({ props })}
					<InputGroup.Root>
						<InputGroup.Input
							type="text"
							placeholder="Username"
							{...props}
							bind:value={$formData.username}
						/>

						<InputGroup.Addon>
							<PhUserCircleDuotone />
						</InputGroup.Addon>
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="password">
			<Form.Control>
				{#snippet children({ props })}
					<InputGroup.Root>
						<InputGroup.Input
							{type}
							placeholder="Password"
							{...props}
							bind:value={$formData.password}
						/>

						<InputGroup.Addon>
							<PhKeyDuotone />
						</InputGroup.Addon>

						<InputGroup.Addon align="inline-end">
							{@render passwordToggle()}
						</InputGroup.Addon>
					</InputGroup.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />

			{#if data.isFirstUser}
				<Form.Description class="mt-3 rounded-md bg-info/4 p-2 text-center text-base text-info">
					Store your credentials somewhere safe! There is no way to recover the admin credentials.
				</Form.Description>
			{/if}
		</Form.Field>
	</div>

	<Form.Button type="submit" class="mx-auto">{buttonText}</Form.Button>
</form>
