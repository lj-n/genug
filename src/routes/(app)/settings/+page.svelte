<script lang="ts">
	import { ThemeControl } from '$lib/components/features/theme';
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { InputPassword } from '$lib/components/ui/input-password';
	import * as Page from '$lib/components/ui/page';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, type Locale, locales, setLocale } from '$lib/paraglide/runtime';
	import { changePassword, changeUsername, getUser } from '$lib/remote-functions/user.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let value: Locale = $state(getLocale());
	const user = $derived(await getUser());

	const usernameSubmit = createFormSubmit(() => changeUsername, {
		onSuccess: (form) => form.element.reset(),
		toast: { success: () => m.saved() }
	});

	const passwordSubmit = createFormSubmit(() => changePassword, {
		onSuccess: (form) => form.element.reset(),
		toast: { success: () => m.settings_password_changed() }
	});
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>{data.title}</Page.Title>
	</Page.Header>

	<Page.Content class="max-w-xl">
		<form {...usernameSubmit.attrs} class="grid gap-3 rounded-lg bg-muted/5 p-3">
			<h2 class="font-semibold">{m.settings_change_display_name()}</h2>

			<FormField
				field={changeUsername.fields.username}
				label={m.settings_label_display_name()}
				hideLabel
			>
				{#snippet input(field)}
					<Input {...field.as('text', user.username)} />
				{/snippet}
			</FormField>

			<Button
				type="submit"
				class="ml-auto"
				loading={usernameSubmit.pending}
				{@attach usernameSubmit.anchor}
			>
				{m.save()}
			</Button>
		</form>

		<form {...passwordSubmit.attrs} class="grid gap-3 rounded-lg bg-muted/5 p-3">
			<h2 class="font-semibold">{m.settings_change_password()}</h2>

			<FormField
				field={changePassword.fields._oldPassword}
				label={m.settings_label_current_password()}
			>
				{#snippet input(field)}
					<InputPassword hideKeyIcon {...field.as('text')} />
				{/snippet}
			</FormField>

			<FormField field={changePassword.fields._password} label={m.settings_label_new_password()}>
				{#snippet input(field)}
					<InputPassword hideKeyIcon {...field.as('text')} />
				{/snippet}
			</FormField>

			<Button
				type="submit"
				class="ml-auto"
				loading={passwordSubmit.pending}
				{@attach passwordSubmit.anchor}
			>
				{m.settings_save_and_logout()}
			</Button>
		</form>

		<div class="grid gap-3 rounded-lg bg-muted/5 p-3">
			<h2 class="font-semibold">{m.settings_theme()}</h2>

			<ThemeControl theme={data.theme} />
		</div>

		<div class="grid rounded-lg bg-muted/5 p-3">
			<h2 class="mb-6 font-semibold">{m.settings_language()}</h2>

			<Select.Root
				type="single"
				name="locale"
				bind:value
				onValueChange={(locale) => {
					setLocale(locale as Locale);
				}}
			>
				<Select.Trigger class="font-semibold" aria-label={m.settings_available_languages()}>
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
		</div>
	</Page.Content>
</Page.Root>
