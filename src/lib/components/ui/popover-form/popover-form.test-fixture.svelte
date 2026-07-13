<script lang="ts">
	import type { NormalizedFormError } from '$lib/utils/form-error';
	import type { FormSubmitTarget } from '$lib/utils/form-submit.svelte';
	import type { Snippet } from 'svelte';

	import { PopoverForm } from './index';

	let {
		contentStatic = false,
		errors,
		form,
		onSuccess,
		open = $bindable(false)
	}: {
		contentStatic?: boolean;
		errors?: Snippet<[NormalizedFormError]>;
		form: FormSubmitTarget;
		onSuccess?: (form: unknown) => Promise<void> | void;
		open?: boolean;
	} = $props();
</script>

<PopoverForm {form} bind:open {contentStatic} {errors} {onSuccess}>
	{#snippet trigger(props)}
		<button {...props}>open</button>
	{/snippet}

	{#snippet fields()}
		<input name="value" aria-label="value" />
	{/snippet}

	{#snippet footer({ formId, pending })}
		<span data-testid="pending">{pending}</span>
		<button type="submit" form={formId}>Save</button>
	{/snippet}
</PopoverForm>
