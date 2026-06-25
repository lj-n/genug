<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { InputPassword } from '$lib/components/ui/input-password';
	import * as Page from '$lib/components/ui/page';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, type Locale, locales, setLocale } from '$lib/paraglide/runtime';
	import { changePassword, changeUsername, getUser } from '$lib/remote-functions/user.remote';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let value: Locale = $state(getLocale());
	const user = $derived(await getUser());
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>{data.title}</Page.Title>
	</Page.Header>

	<Page.Content class="max-w-xl">
		<form {...changeUsername} class="grid gap-3 rounded-lg bg-muted/5 p-3">
			<h2 class="font-semibold">{m.settings_change_display_name()}</h2>

			<Input
				aria-label={m.settings_label_display_name()}
				{...changeUsername.fields.username.as('text', user.username)}
			/>

			{#each changeUsername.fields.username.issues() as issue (issue)}
				<p class="text-sm text-error">{issue.message}</p>
			{/each}

			<Button type="submit" class="ml-auto">{m.save()}</Button>
		</form>

		<form {...changePassword} class="grid gap-3 rounded-lg bg-muted/5 p-3">
			<h2 class="font-semibold">{m.settings_change_password()}</h2>

			<label class="space-y-1">
				<span class="text-sm font-medium text-muted">{m.settings_label_current_password()}</span>
				<InputPassword hideKeyIcon {...changePassword.fields._oldPassword.as('text')} />
			</label>

			{#each changePassword.fields._oldPassword.issues() as issue (issue)}
				<p class="text-sm text-error">{issue.message}</p>
			{/each}

			<label class="space-y-1">
				<span class="text-sm font-medium text-muted">{m.settings_label_new_password()}</span>
				<InputPassword hideKeyIcon {...changePassword.fields._password.as('text')} />
			</label>

			{#each changePassword.fields._password.issues() as issue (issue)}
				<p class="text-sm text-error">{issue.message}</p>
			{/each}

			<Button type="submit" class="ml-auto">{m.settings_save_and_logout()}</Button>
		</form>

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
