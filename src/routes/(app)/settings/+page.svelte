<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { InputPassword } from '$lib/components/ui/input-password';
	import * as Page from '$lib/components/ui/page';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, type Locale, locales, setLocale } from '$lib/paraglide/runtime';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	import type { PageProps } from './$types';

	import { schemaChangePassword, schemaUsername } from './schema';

	let { data }: PageProps = $props();

	const formPassword = superForm(
		untrack(() => data.forms.changePassword),
		{
			onUpdated(event) {
				if (event.form.message?.type === 'success') {
					goto(resolve('/login'));
				}
			},
			validators: zod4Client(schemaChangePassword)
		}
	);
	const { enhance: enhancePassword, form: formPasswordData } = formPassword;

	const formUsername = superForm(
		untrack(() => data.forms.changeUsername),
		{ resetForm: false, validators: zod4Client(schemaUsername) }
	);
	const { enhance: enhanceUsername, form: formUsernameData } = formUsername;

	let value: Locale = $state(getLocale());
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>{data.title}</Page.Title>
	</Page.Header>

	<Page.Content class="max-w-xl">
		<form
			action="?/changeUsername"
			method="post"
			class="grid rounded-lg bg-muted/5 p-3"
			use:enhanceUsername
		>
			<h2 class="mb-6 font-semibold">{m.settings_change_display_name()}</h2>

			<Form.Field form={formUsername} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.settings_label_display_name()}</Form.Label>
						<Input {...props} bind:value={$formUsernameData.username} class="text-lg" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button class="ml-auto">{m.save()}</Form.Button>
		</form>

		<form
			action="?/changePassword"
			method="post"
			class="grid rounded-lg bg-muted/5 p-3"
			use:enhancePassword
		>
			<h2 class="mb-6 font-semibold">{m.settings_change_password()}</h2>

			<Form.Field form={formPassword} name="oldPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.settings_label_current_password()}</Form.Label>
						<InputPassword hideKeyIcon {...props} bind:value={$formPasswordData.oldPassword} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={formPassword} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.settings_label_new_password()}</Form.Label>
						<InputPassword hideKeyIcon {...props} bind:value={$formPasswordData.password} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button class="ml-auto">{m.settings_save_and_logout()}</Form.Button>
		</form>

		<form action="" method="post" class="grid rounded-lg bg-muted/5 p-3">
			<h2 class="mb-6 font-semibold">{m.settings_language()}</h2>

			<Select.Root
				type="single"
				name="locale"
				bind:value
				onValueChange={(locale) => {
					setLocale(locale as Locale);
				}}
			>
				<Select.Trigger class="font-semibold">
					{value}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>{m.settings_available_languages()}</Select.Label>
						{#each locales as locale (locale)}
							<Select.Item value={locale} label={locale} class="font-semibold">
								{locale}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</form>
	</Page.Content>
</Page.Root>
