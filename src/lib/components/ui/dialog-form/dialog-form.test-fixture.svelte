<script lang="ts">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { FormSubmitTarget } from '$lib/utils/form-submit.svelte';
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';

	import { DialogForm } from './index';

	let {
		errors,
		form,
		onSuccess,
		open = $bindable(false)
	}: {
		errors?: Snippet<[NormalizedFormError]>;
		form: FormSubmitTarget;
		onSuccess?: (form: unknown) => Promise<void> | void;
		open?: boolean;
	} = $props();
</script>

<DialogForm {form} bind:open {errors} {onSuccess}>
	{#snippet trigger(props)}
		<button {...props}>open</button>
	{/snippet}

	{#snippet header()}
		<Dialog.Title>Edit</Dialog.Title>
	{/snippet}

	{#snippet fields()}
		<input name="value" aria-label="value" />
	{/snippet}

	{#snippet footer({ formId, pending })}
		<span data-testid="pending">{pending}</span>
		<button type="submit" form={formId}>Save</button>
	{/snippet}
</DialogForm>
