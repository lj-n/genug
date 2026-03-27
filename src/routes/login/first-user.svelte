<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { untrack } from 'svelte';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { schema } from './schema';
	import PhUserCircleDuotone from '~icons/ph/user-circle-duotone';
	import PhKeyDuotone from '~icons/ph/key-duotone';
	import PhEyeClosed from '~icons/ph/eye-closed';
	import PhEye from '~icons/ph/eye';
	import Logo from '$lib/components/logo.svelte';

	let { data }: { data: { form: SuperValidated<Infer<typeof schema>> } } = $props();

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

<form action="?/firstUser" method="POST" use:enhance class="grid max-w-sm space-y-6">
	<Logo class="mx-auto w-52" aria-hidden />

	<p class="text-center">
		Let's get started by creating the first user. This user will be the administrator of this
		genug-instance.
	</p>

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
			<Form.Description class="mt-3 rounded-md bg-info/4 p-2 text-center text-base text-info">
				Store your credentials somewhere safe! There is no way to recover the admin credentials.
			</Form.Description>
		</Form.Field>
	</div>

	<Form.Button type="submit" class="mx-auto">Create Admin User</Form.Button>
</form>
