<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { m } from '$lib/paraglide/messages';
	import { editCategory, getCategoryById } from '$lib/remote-functions/category.remote';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import TargetIcon from '~icons/ph/target';

	let {
		category,
		currency
	}: {
		category: Awaited<ReturnType<typeof getCategoryById>>;
		currency: (typeof CURRENCIES)[number];
	} = $props();

	const submit = createFormSubmit(() => editCategory, {
		toast: { placement: 'left', success: () => m.saved() }
	});

	$effect(() => {
		editCategory.fields.targetBalance.set(category.targetBalance ?? 0);
	});
</script>

{#snippet targetField()}
	<InputGroup.Root>
		<InputGroup.Addon>
			<TargetIcon class="size-4" />
		</InputGroup.Addon>

		<InputGroup.InputMoney
			name={editCategory.fields.targetBalance.as('number').name}
			bind:value={
				() => editCategory.fields.targetBalance.value(),
				(v) => editCategory.fields.targetBalance.set(v)
			}
			{currency}
			aria-invalid={editCategory.fields.targetBalance.issues()?.length ? true : undefined}
			aria-label={m.category_label_targetbalance()}
		/>
	</InputGroup.Root>
{/snippet}

<form {...submit.attrs} class="grid gap-3">
	<h2 class="font-semibold">{m.category_section_title_edit()}</h2>

	<input {...editCategory.fields.categoryId.as('hidden', category.id)} />

	<FormField field={editCategory.fields.categoryName} label={m.category_label_name()}>
		{#snippet input(field)}
			<Input {...field.as('text', category.name)} placeholder={m.category_placeholder_name()} />
		{/snippet}
	</FormField>

	<FormField field={editCategory.fields.notes} label={m.category_label_notes()}>
		{#snippet input(field)}
			<Textarea
				{...field.as('text', category.notes ?? '')}
				class="min-h-24 resize-none"
				placeholder={m.category_placeholder_notes()}
			/>
		{/snippet}
	</FormField>

	<FormField field={editCategory.fields.targetBalance} label={m.category_label_targetbalance()}>
		{#snippet input()}
			{@render targetField()}
		{/snippet}
	</FormField>

	<Button {@attach submit.anchor} type="submit" class="ml-auto" loading={submit.pending}>
		{m.save()}
	</Button>
</form>
