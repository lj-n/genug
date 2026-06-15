<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { editCategory, getCategoryById } from '$lib/remote-functions/category.remote';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { createSingletonToast } from '$lib/utils/singleton-toast.svelte';
	import { fly } from 'svelte/transition';
	import PhFloppyDiskDuotone from '~icons/ph/floppy-disk-duotone';
	import PhTarget from '~icons/ph/target';

	let { categoryId }: { categoryId: string } = $props();

	const category = $derived(await getCategoryById({ categoryId }));
	const budget = $derived(await getBudget(category.budgetId));
	const currency = $derived(budget.currency);

	let savedToast = createSingletonToast();

	const formId = $props.id();
</script>

<form
	{...editCategory.enhance(async (form) => {
		if (await form.submit()) {
			savedToast.trigger();
		}
	})}
	id={formId}
	class="relative flex flex-col gap-2"
>
	{#if savedToast.show}
		<div
			class="absolute -top-10 right-2 flex items-center gap-1 rounded-md border border-success/50 bg-surface-high px-3 py-1 font-medium text-success shadow-lg"
			transition:fly={{ duration: 200, x: -20 }}
		>
			<PhFloppyDiskDuotone />
			<span>{m.saved()}</span>
		</div>
	{/if}

	<input {...editCategory.fields.categoryId.as('hidden', category.id)} />

	<input type="submit" hidden />

	<Input
		{...editCategory.fields.categoryName.as('text', category.name)}
		class="h-12 text-xl font-semibold"
		placeholder={m.category_label_name()}
		aria-label={m.category_label_name()}
		onblur={() =>
			formId && (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit()}
	/>

	<Textarea
		{...editCategory.fields.notes.as('text', category.notes ?? '')}
		class="min-h-30 resize-none py-2 text-base"
		placeholder={m.category_placeholder_notes()}
		aria-label={m.category_label_notes()}
		onblur={() =>
			formId && (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit()}
	/>

	<InputGroup.Root>
		<InputGroup.InputCurrency
			name={editCategory.fields.targetBalance.as('number').name}
			bind:value={
				() => editCategory.fields.targetBalance.value() ?? category.targetBalance ?? 0,
				(v) => editCategory.fields.targetBalance.set(v)
			}
			{currency}
			class="h-12 text-center text-xl font-semibold placeholder:text-base placeholder:font-normal"
			placeholder={formatCurrency({ centValue: 0, currency })}
			aria-label={m.category_label_targetbalance()}
			onblur={() =>
				formId && (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit()}
		/>

		<InputGroup.Addon align="block-end">
			<InputGroup.Text class="mx-auto">
				<PhTarget class="size-6" />
				<span>{m.category_label_targetbalance()}</span>
			</InputGroup.Text>
		</InputGroup.Addon>
	</InputGroup.Root>
</form>
