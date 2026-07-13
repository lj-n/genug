<script lang="ts" generics="TForm extends FormSubmitTarget">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { RemoteQueryUpdate } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { m } from '$lib/paraglide/messages';
	import {
		createFormSubmit,
		type EnhancedForm,
		type FormSubmitTarget
	} from '$lib/utils/form-submit.svelte';

	let {
		errors,
		fields,
		footer,
		form,
		header,
		onSuccess,
		open = $bindable(false),
		trigger,
		updates,
		...restProps
	}: {
		errors?: Snippet<[NormalizedFormError]>;
		/** Hidden inputs scoping the confirmation (ids and the like). */
		fields?: Snippet;
		footer: Snippet<[{ formId: string; pending: boolean }]>;
		form: TForm;
		header: Snippet;
		/** Replaces the default success behavior of closing the dialog. */
		onSuccess?: (form: EnhancedForm<TForm>) => Promise<void> | void;
		open?: boolean;
		/** Omit to control the dialog through `bind:open` instead. */
		trigger?: Snippet<[Record<string, unknown>]>;
		updates?: () => RemoteQueryUpdate[];
	} = $props();

	const formId = $props.id();

	const submit = createFormSubmit(() => form, {
		onSuccess: async (instance) => {
			if (onSuccess) await onSuccess(instance);
			else open = false;
		},
		// Getter keeps the prop live instead of capturing its initial value.
		get updates() {
			return updates;
		}
	});

	// Clear any thrown error when the dialog closes so it never flashes on reopen.
	$effect(() => {
		if (!open) submit.reset();
	});
</script>

<AlertDialog.Root bind:open {...restProps}>
	{#if trigger}
		<AlertDialog.Trigger>
			{#snippet child({ props })}
				{@render trigger(props)}
			{/snippet}
		</AlertDialog.Trigger>
	{/if}

	<AlertDialog.Content>
		<form id={formId} {...submit.attrs} class="contents">
			{@render fields?.()}
		</form>

		<AlertDialog.Header>
			{@render header()}
		</AlertDialog.Header>

		{#if submit.error}
			{#if errors}
				{@render errors(submit.error)}
			{:else}
				<p class="text-sm text-error" role="alert">{submit.error.message}</p>
			{/if}
		{/if}

		<AlertDialog.Footer>
			<AlertDialog.Cancel>{m.cancel()}</AlertDialog.Cancel>
			{@render footer({ formId, pending: submit.pending })}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
