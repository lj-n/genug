<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { createSingletonToast } from '$lib/utils/singleton-toast.svelte';
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhFloppyDiskDuotone from '~icons/ph/floppy-disk-duotone';
	import PhQuestion from '~icons/ph/question';
	import PhTarget from '~icons/ph/target';

	import type { PageData } from './$types';

	import { editSchema } from './schema';

	type CategoryEditProps = {
		form: PageData['editForm'];
	};

	let { form: editForm }: CategoryEditProps = $props();

	const { locale, numberFormatOptions } = getIntlContext();

	let savedToast = createSingletonToast();

	const form = superForm(
		untrack(() => editForm),
		{
			applyAction: false,
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					savedToast.trigger();
				}
			},
			resetForm: false,
			validationMethod: 'onblur',
			validators: zod4Client(editSchema)
		}
	);

	const { enhance, form: formData, isTainted, submit } = form;

	function editCategory() {
		if (isTainted()) {
			submit();
		}
	}
</script>

<form class="relative flex flex-col gap-2" use:enhance method="POST" action="?/edit">
	<input type="submit" hidden />

	{#if savedToast.show}
		<div
			class="absolute -top-8 right-2 flex items-center gap-1 font-medium text-success"
			transition:fly={{ duration: 200, x: -20 }}
		>
			<PhFloppyDiskDuotone />
			<span>{m.saved()}</span>
		</div>
	{/if}

	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Input
					{...props}
					bind:value={$formData.name}
					class="h-12 text-xl font-semibold"
					placeholder={m.category_label_name()}
					aria-label={m.category_label_name()}
					onblur={editCategory}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="notes">
		<Form.Control>
			{#snippet children({ props })}
				<Textarea
					{...props}
					bind:value={$formData.notes}
					class="min-h-30 resize-none py-2 text-base"
					placeholder={m.category_placeholder_notes()}
					aria-label={m.category_label_notes()}
					onblur={editCategory}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="targetBalance">
		<Form.Control>
			{#snippet children({ props })}
				<InputGroup.Root>
					<InputGroup.InputCurrency
						{...props}
						bind:value={$formData.targetBalance}
						intlConfig={{ locale, ...numberFormatOptions }}
						class="h-12 text-xl font-semibold placeholder:text-base placeholder:font-normal"
						placeholder={m.category_placeholder_targetbalance()}
						aria-label={m.category_label_targetbalance()}
						onblur={editCategory}
					/>

					<InputGroup.Addon>
						<PhTarget class="size-6" />
					</InputGroup.Addon>

					<InputGroup.Addon align="inline-end">
						<PhQuestion class="size-6" />
					</InputGroup.Addon>
				</InputGroup.Root>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
</form>
