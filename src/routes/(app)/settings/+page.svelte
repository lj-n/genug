<script lang="ts">
	import { ApiTokenManager } from '$lib/components/features/api-tokens';
	import { ThemeControl } from '$lib/components/features/theme';
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { InputPassword } from '$lib/components/ui/input-password';
	import * as Page from '$lib/components/ui/page';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, type Locale, locales, setLocale } from '$lib/paraglide/runtime';
	import { getCheckpointSummary } from '$lib/remote-functions/register.remote';
	import {
		changeCheckpointThresholds,
		changePassword,
		changeUsername,
		getUser
	} from '$lib/remote-functions/user.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let value: Locale = $state(getLocale());
	const user = $derived(await getUser());

	const usernameSubmit = createFormSubmit(() => changeUsername, {
		onSuccess: (form) => form.element.reset(),
		toast: { success: () => m.saved() }
	});

	const thresholdsSubmit = createFormSubmit(() => changeCheckpointThresholds, {
		toast: { success: () => m.saved() },
		// Query functions: account pages stay cached for a Back navigation.
		updates: () => [getCheckpointSummary]
	});

	// A switched-off threshold keeps its number box filled with the column
	// default, so switching it back on starts somewhere sensible.
	const thresholds = $derived([
		{
			enabled: changeCheckpointThresholds.fields.daysEnabled,
			fallback: user.checkpointThresholdDefaults.days,
			label: m.settings_checkpoint_days_label(),
			stored: user.checkpointDaysThreshold,
			value: changeCheckpointThresholds.fields.days
		},
		{
			enabled: changeCheckpointThresholds.fields.countEnabled,
			fallback: user.checkpointThresholdDefaults.count,
			label: m.settings_checkpoint_count_label(),
			stored: user.checkpointCountThreshold,
			value: changeCheckpointThresholds.fields.count
		}
	]);

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
		<div class="space-y-3">
			<form {...usernameSubmit.attrs} class="grid gap-3">
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

			<Separator class="mt-6 mb-3" />

			<form {...passwordSubmit.attrs} class="grid gap-3">
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

			<Separator class="mt-6 mb-3" />

			<form {...thresholdsSubmit.attrs} class="grid gap-3">
				<h2 class="font-semibold">{m.settings_checkpoint_reminders()}</h2>
				<p class="text-sm text-muted">{m.settings_checkpoint_reminders_description()}</p>

				{#each thresholds as threshold (threshold.label)}
					{@const enabled = threshold.enabled.value() ?? threshold.stored !== null}
					<div class="grid gap-0.5">
						<div class="flex items-center gap-3">
							<label
								class="flex flex-1 items-center gap-2 pl-1.5 text-sm font-semibold tracking-tight"
							>
								<input
									{...threshold.enabled.as('checkbox', threshold.stored !== null)}
									class="size-4 shrink-0 accent-interactive"
								/>
								{threshold.label}
							</label>
							<Input
								{...threshold.value.as('number', threshold.stored ?? threshold.fallback)}
								aria-label={threshold.label}
								class="w-24 text-right"
								disabled={!enabled}
								min="1"
								max="999"
								step="1"
							/>
						</div>
						{#each threshold.value.issues() as issue (issue)}
							<p class="text-sm text-error">{issue.message}</p>
						{/each}
					</div>
				{/each}

				<Button
					type="submit"
					class="ml-auto"
					loading={thresholdsSubmit.pending}
					{@attach thresholdsSubmit.anchor}
				>
					{m.save()}
				</Button>
			</form>

			<Separator class="mt-6 mb-3" />

			<div class="grid gap-3">
				<h2 class="font-semibold">{m.settings_theme()}</h2>

				<ThemeControl theme={data.theme} />
			</div>

			<Separator class="mt-6 mb-3" />

			<div class="grid gap-3">
				<h2 class="font-semibold">{m.settings_api_tokens()}</h2>

				<ApiTokenManager />
			</div>

			<Separator class="mt-6 mb-3" />

			<div class="grid gap-3">
				<h2 class="font-semibold">{m.settings_language()}</h2>

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
		</div>
	</Page.Content>
</Page.Root>
