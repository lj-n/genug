<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency
	} from '$lib/components/utils';
	import {
		defaults,
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { formSchema, type FormSchema } from './schema';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { invalidateAll } from '$app/navigation';

	export let budgetRow: PageData['budget'][number];
	export let data: SuperValidated<Infer<FormSchema>>;

	const form = superForm(
		{ budget: budgetRow.budget, categoryId: budgetRow.id },
		{
			validators: zodClient(formSchema),
			applyAction: true,
			onResult(event) {
				invalidateAll();
				if (event.result.type === 'success') {
					open = false;
				}
			}
		}
	);

	const { form: formData, enhance, allErrors } = form;

	let open = false;
</script>

<Dialog.Root
	bind:open
	onOpenChange={(change) => {
		if (change === false) {
			form.reset();
		}
	}}
>
	<Dialog.Trigger
		class={buttonVariants({
			variant: 'outline',
			class: 'h-fit px-2 py-1 font-semibold'
		})}
	>
		{formatFractionToLocaleCurrency(budgetRow.budget)}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Set Budget</Dialog.Title>
			<Dialog.Description>{budgetRow.name}</Dialog.Description>
		</Dialog.Header>

		<form method="POST" use:enhance>
			<input type="hidden" name="categoryId" value={budgetRow.id} />
			<Form.Field {form} name="budget">
				<Form.Control let:attrs>
					<Form.Label>Budget Amount</Form.Label>
					<Input
						{...attrs}
						type="number"
						bind:value={$formData.budget}
						pattern={currencyInputProps.pattern}
					/>
				</Form.Control>
				<Form.Description>{currencyInputProps.information}</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Button type="submit" class="ml-auto">Save</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
