<script lang="ts">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { FormSubmitTarget } from '$lib/utils/form-submit.svelte';
	import type { Snippet } from 'svelte';

	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	import { AlertDialogForm } from './index';

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

<AlertDialogForm {form} bind:open {errors} {onSuccess}>
	{#snippet trigger(props)}
		<button {...props}>open</button>
	{/snippet}

	{#snippet header()}
		<AlertDialog.Title>Delete?</AlertDialog.Title>
		<AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
	{/snippet}

	{#snippet fields()}
		<input type="hidden" name="id" value="1" />
	{/snippet}

	{#snippet footer({ formId, pending })}
		<span data-testid="pending">{pending}</span>
		<button type="submit" form={formId}>Confirm</button>
	{/snippet}
</AlertDialogForm>
