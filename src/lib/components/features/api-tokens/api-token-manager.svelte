<script lang="ts">
	import type { CalendarDate } from '@internationalized/date';

	import { page } from '$app/state';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { AlertDialogForm } from '$lib/components/ui/alert-dialog-form';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages';
	import {
		getApiTokens,
		issueApiToken,
		revokeApiToken
	} from '$lib/remote-functions/api-token.remote';
	import { copyToClipboard } from '$lib/utils/copy-to-clipboard';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { formatDate } from '$lib/utils/format-date';
	import { renderSVG } from 'uqr';
	import CopySimpleIcon from '~icons/ph/copy-simple';
	import TrashIcon from '~icons/ph/trash';

	const tokens = $derived(await getApiTokens());

	let expiresAt = $state<CalendarDate | undefined>(undefined);

	const createSubmit = createFormSubmit(() => issueApiToken, {
		onSuccess: (form) => {
			form.element.reset();
			expiresAt = undefined;
		},
		updates: () => [getApiTokens()]
	});

	let openReveal = $state(false);
	let openRevoke = $state(false);
	let selectedTokenId = $state('');

	const issued = $derived(issueApiToken.result);
	// The QR payload the iOS app scans to connect: the instance origin plus
	// the one-time plaintext token.
	const qrSvg = $derived(
		issued
			? renderSVG(JSON.stringify({ serverUrl: page.url.origin, token: issued.token }), {
					border: 2
				})
			: undefined
	);

	$effect(() => {
		if (issued) openReveal = true;
	});

	const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' } as const;
</script>

<p class="text-sm text-muted">{m.api_token_description()}</p>

<form {...createSubmit.attrs} class="grid gap-3">
	<FormField field={issueApiToken.fields.name} label={m.api_token_label_name()}>
		{#snippet input(field)}
			<Input {...field.as('text')} />
		{/snippet}
	</FormField>

	<div class="grid gap-2">
		<Label>{m.api_token_label_expiry()}</Label>
		<DatePicker
			name={issueApiToken.fields.expiresAt.as('date').name}
			bind:value={expiresAt}
			label={m.api_token_label_expiry()}
		/>
	</div>

	<Button
		type="submit"
		class="ml-auto"
		loading={createSubmit.pending}
		{@attach createSubmit.anchor}
	>
		{m.api_token_create_button()}
	</Button>
</form>

{#if tokens.length === 0}
	<p class="text-sm text-muted">{m.api_token_list_empty()}</p>
{:else}
	<ul aria-label={m.settings_api_tokens()} class="grid gap-2">
		{#each tokens as token (token.id)}
			<li
				class="flex items-center gap-3 rounded-lg border border-muted/20 bg-surface-high p-3 shadow-xs"
			>
				<div class="min-w-0">
					<div class="truncate font-medium">{token.name}</div>
					<div class="text-sm text-muted">
						{m.api_token_created_at({
							date: formatDate({ date: token.createdAt, options: dateOptions })
						})}
						·
						{token.lastUsedAt
							? m.api_token_last_used({
									date: formatDate({ date: token.lastUsedAt, options: dateOptions })
								})
							: m.api_token_never_used()}
						{#if token.expiresAt}
							·
							{m.api_token_expires({
								date: formatDate({ date: token.expiresAt, options: dateOptions })
							})}
						{/if}
					</div>
				</div>

				<Button
					size="icon-sm"
					variant="destructive"
					class="ml-auto"
					onclick={() => {
						selectedTokenId = token.id;
						openRevoke = true;
					}}
				>
					<TrashIcon />
					<span class="sr-only">{m.api_token_revoke()} {token.name}</span>
				</Button>
			</li>
		{/each}
	</ul>
{/if}

<AlertDialogForm form={revokeApiToken} bind:open={openRevoke} updates={() => [getApiTokens()]}>
	{#snippet header()}
		<AlertDialog.Title>{m.api_token_revoke_confirm_title()}</AlertDialog.Title>
		<AlertDialog.Description>{m.api_token_revoke_confirm_description()}</AlertDialog.Description>
	{/snippet}

	{#snippet fields()}
		<input {...revokeApiToken.fields.tokenId.as('hidden', selectedTokenId)} />
	{/snippet}

	{#snippet footer({ formId, pending })}
		<Button type="submit" form={formId} variant="destructive" loading={pending}>
			{m.api_token_revoke()}
		</Button>
	{/snippet}
</AlertDialogForm>

<Dialog.Root bind:open={openReveal}>
	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.api_token_created_title()}</Dialog.Title>
			<Dialog.Description>{m.api_token_created_description()}</Dialog.Description>
		</Dialog.Header>

		{#if issued && qrSvg}
			<div class="grid justify-items-center gap-2">
				<!-- Fixed white backdrop in both themes: scanners need dark-on-light contrast. -->
				<div
					role="img"
					aria-label={m.api_token_qr_alt()}
					class="w-52 rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- locally generated QR markup -->
					{@html qrSvg}
				</div>
				<div class="text-sm text-muted">{page.url.origin}</div>
			</div>

			<div class="flex items-center justify-between gap-4 rounded-lg bg-muted/5 p-2">
				<div class="min-w-0 p-3 break-all text-info" aria-label="api-token">{issued.token}</div>
				<Button size="icon" {@attach copyToClipboard(issued.token)}>
					<CopySimpleIcon />
					<span class="sr-only">{m.api_token_copy()}</span>
				</Button>
			</div>
		{/if}

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'default' })}>{m.dialog_close()}</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
