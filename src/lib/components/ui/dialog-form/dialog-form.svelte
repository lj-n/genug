<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import { type NormalizedFormError, normalizeFormError } from '$lib/utils/form-error';
	import { cn } from 'tailwind-variants';

	let {
		contentClass = '',
		enhance,
		errors,
		fields,
		footer,
		header,
		interactOutsideBehavior = undefined,
		open = $bindable(false),
		resetOnClose = true,
		trigger,
		...restProps
	}: {
		contentClass?: string;
		enhance: (
			onSubmit: (form: { submit: () => Promise<boolean> }) => Promise<void>
		) => Record<string, unknown>;
		errors?: Snippet<[NormalizedFormError]>;
		fields: Snippet;
		footer: Snippet<[{ formId: string }]>;
		header: Snippet;
		interactOutsideBehavior?: 'ignore' | undefined;
		open?: boolean;
		resetOnClose?: boolean;
		trigger: Snippet<[Record<string, unknown>]>;
	} = $props();

	const formId = $props.id();

	let _error = $state<NormalizedFormError | null>(null);

	function resetError() {
		_error = null;
	}

	// Clear any thrown error when the dialog closes so it never flashes on reopen.
	$effect(() => {
		if (!open) resetError();
	});
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			{@render trigger(props)}
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class={cn('max-w-lg gap-6', contentClass)} {interactOutsideBehavior}>
		<Dialog.Header>
			{@render header()}
		</Dialog.Header>

		<form
			id={formId}
			{...enhance(async (f) => {
				resetError();
				try {
					if (await f.submit()) {
						open = false;
					}
				} catch (e) {
					_error = normalizeFormError(e);
				}
			})}
		>
			{#if resetOnClose}
				{#key open}
					{@render fields()}
				{/key}
			{:else}
				{@render fields()}
			{/if}
		</form>

		{#if _error}
			{#if errors}
				{@render errors(_error)}
			{:else}
				<p class="text-sm text-error" role="alert">{_error.message}</p>
			{/if}
		{/if}

		<Dialog.Footer>
			{@render footer({ formId })}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
