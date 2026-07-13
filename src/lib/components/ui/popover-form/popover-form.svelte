<script lang="ts" generics="TForm extends FormSubmitTarget">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { RemoteQueryUpdate } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';

	import * as Popover from '$lib/components/ui/popover';
	import {
		createFormSubmit,
		type EnhancedForm,
		type FormSubmitTarget
	} from '$lib/utils/form-submit.svelte';
	import { Popover as PopoverPrimitive } from 'bits-ui';

	let {
		align = 'center',
		contentClass = '',
		contentStatic = false,
		errors,
		fields,
		footer,
		form,
		formClass = '',
		onSuccess,
		open = $bindable(false),
		sideOffset = 4,
		trigger,
		updates,
		...restProps
	}: {
		align?: 'center' | 'end' | 'start';
		contentClass?: string;
		/** Renders the content in place (bits-ui `ContentStatic`) for site-positioned overlays. */
		contentStatic?: boolean;
		errors?: Snippet<[NormalizedFormError]>;
		fields: Snippet;
		footer?: Snippet<[{ formId: string; pending: boolean }]>;
		form: TForm;
		formClass?: string;
		/** Replaces the default success behavior of closing the popover. */
		onSuccess?: (form: EnhancedForm<TForm>) => Promise<void> | void;
		open?: boolean;
		sideOffset?: number;
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

	// Clear any thrown error when the popover closes so it never flashes on reopen.
	$effect(() => {
		if (!open) submit.reset();
	});
</script>

<Popover.Root bind:open {...restProps}>
	<Popover.Trigger>
		{#snippet child({ props })}
			{@render trigger(props)}
		{/snippet}
	</Popover.Trigger>

	{#if contentStatic}
		<PopoverPrimitive.ContentStatic class={contentClass}>
			{@render body()}
		</PopoverPrimitive.ContentStatic>
	{:else}
		<Popover.Content {align} {sideOffset} class={contentClass}>
			{@render body()}
		</Popover.Content>
	{/if}
</Popover.Root>

{#snippet body()}
	<form id={formId} {...submit.attrs} class={formClass}>
		{@render fields()}

		{#if submit.error}
			{#if errors}
				{@render errors(submit.error)}
			{:else}
				<p class="text-sm text-error" role="alert">{submit.error.message}</p>
			{/if}
		{/if}

		{@render footer?.({ formId, pending: submit.pending })}
	</form>
{/snippet}
