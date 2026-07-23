<script lang="ts" generics="TForm extends FormSubmitTarget">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { RemoteQueryUpdate } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import {
		createFormSubmit,
		type EnhancedForm,
		type FormSubmitTarget
	} from '$lib/utils/form-submit.svelte';

	let {
		contentClass = '',
		errors,
		fields,
		footer,
		form,
		header,
		interactOutsideBehavior = undefined,
		onSuccess,
		open = $bindable(false),
		resetOnClose = true,
		trigger,
		updates,
		...restProps
	}: {
		contentClass?: string;
		errors?: Snippet<[NormalizedFormError]>;
		fields: Snippet;
		footer: Snippet<[{ formId: string; pending: boolean }]>;
		form: TForm;
		header: Snippet;
		interactOutsideBehavior?: 'ignore' | undefined;
		/** Replaces the default success behavior of closing the dialog. */
		onSuccess?: (form: EnhancedForm<TForm>) => Promise<void> | void;
		open?: boolean;
		resetOnClose?: boolean;
		trigger: Snippet<[Record<string, unknown>]>;
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

<Dialog.Root bind:open {...restProps}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			{@render trigger(props)}
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class={contentClass} {interactOutsideBehavior}>
		<Dialog.Header>
			{@render header()}
		</Dialog.Header>

		<Dialog.Body class="flex flex-col gap-6">
			<form id={formId} {...submit.attrs}>
				{#if resetOnClose}
					{#key open}
						{@render fields()}
					{/key}
				{:else}
					{@render fields()}
				{/if}
			</form>

			{#if submit.error}
				{#if errors}
					{@render errors(submit.error)}
				{:else}
					<p class="text-sm text-error" role="alert">{submit.error.message}</p>
				{/if}
			{/if}
		</Dialog.Body>

		<Dialog.Footer>
			{@render footer({ formId, pending: submit.pending })}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
