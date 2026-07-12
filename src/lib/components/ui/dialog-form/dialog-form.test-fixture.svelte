<script lang="ts">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';

	import { DialogForm } from './index';

	let {
		enhance,
		errors,
		open = $bindable(false)
	}: {
		enhance: (
			onSubmit: (form: { submit: () => Promise<boolean> }) => Promise<void>
		) => Record<string, unknown>;
		errors?: Snippet<[NormalizedFormError]>;
		open?: boolean;
	} = $props();
</script>

<DialogForm {enhance} bind:open {errors}>
	{#snippet trigger(props)}
		<button {...props}>open</button>
	{/snippet}

	{#snippet header()}
		<Dialog.Title>Edit</Dialog.Title>
	{/snippet}

	{#snippet fields()}
		<input name="value" aria-label="value" />
	{/snippet}

	{#snippet footer({ formId })}
		<button type="submit" form={formId}>Save</button>
	{/snippet}
</DialogForm>
