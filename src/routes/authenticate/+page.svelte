<script lang="ts">
	import type { PageData } from './$types';

	import * as Form from '$lib/components/ui/form';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';
	import { Input } from '$lib/components/ui/input';

	export let data: PageData;

	const form = superForm(data.form, {
		validators: zodClient(formSchema)
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Login & Signup</title>
</svelte:head>

<form method="POST" action="?/login" use:enhance class="mx-auto w-full max-w-sm space-y-4">
	<div class="mx-auto mb-8 w-full max-w-64">
		<img src="/logo.svg" alt="genug logo" />
	</div>

	<Form.Field {form} name="username">
		<Form.Control let:attrs>
			<Form.Label>Username</Form.Label>
			<Input {...attrs} bind:value={$formData.username} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="password">
		<Form.Control let:attrs>
			<Form.Label>Password</Form.Label>
			<Input {...attrs} bind:value={$formData.password} type="password" />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<div class="flex">
        <Form.Button class="ml-auto order-2">Login</Form.Button>
		<Form.Button variant="outline" formaction="?/signup" class="order-1">
			Create User
		</Form.Button>
	</div>
</form>
