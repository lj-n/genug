<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
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
		errors?: Snippet<[unknown]>;
		fields: Snippet;
		footer: Snippet<[{ formId: string }]>;
		header: Snippet;
		interactOutsideBehavior?: 'ignore' | undefined;
		open?: boolean;
		resetOnClose?: boolean;
		trigger: Snippet<[Record<string, unknown>]>;
	} = $props();

	const formId = $props.id();

	let _error = $state<unknown>(null);

	function resetError() {
		_error = null;
	}
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
					_error = e;
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

		{#if _error && errors}
			{@render errors(_error)}
		{/if}

		<Dialog.Footer>
			{@render footer({ formId })}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
