<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Page from '$lib/components/ui/page';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageProps } from './$types';

	import { schemaChangePassword, schemaUsername } from './schema';

	let { data }: PageProps = $props();

	const formPassword = superForm(
		untrack(() => data.forms.changePassword),
		{ validators: zod4Client(schemaChangePassword) }
	);
	const { enhance: enhancePassword, form: formPasswordData } = formPassword;

	const formUsername = superForm(
		untrack(() => data.forms.changeUsername),
		{ validators: zod4Client(schemaUsername) }
	);
	const { enhance: enhanceUsername, form: formUsernameData } = formUsername;
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>{data.title}</Page.Title>
	</Page.Header>

	<Page.Content class="max-w-xl">
		<form
			action="?/changeUsername"
			method="post"
			class="rounded-lg bg-muted/5 p-3"
			use:enhanceUsername
		>
			<Form.Field form={formUsername} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Anzeigename</Form.Label>
						<Input {...props} bind:value={$formUsernameData.username} class="text-lg" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</form>

		<form
			action="?/changePassword"
			method="post"
			class="rounded-lg bg-muted/5 p-3"
			use:enhancePassword
		>
			<Form.Field form={formPassword} name="oldPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Aktuelles Passwort</Form.Label>
						<Input {...props} bind:value={$formPasswordData.oldPassword} class="text-lg" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={formPassword} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Neues Passwort</Form.Label>
						<Input {...props} bind:value={$formPasswordData.password} class="text-lg" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</form>
	</Page.Content>
</Page.Root>
