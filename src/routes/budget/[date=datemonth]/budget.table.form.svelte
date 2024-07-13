<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency
	} from '$lib/components/utils';
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { setBudgetFormSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { invalidateAll } from '$app/navigation';

	export let row: PageData['budget'][number];

	const form = superForm(
		{ budget: row.budget, categoryId: row.id },
		{
			validators: zodClient(setBudgetFormSchema),
			onResult(event) {
				invalidateAll();
				if (event.result.type === 'success') {
					open = false;
				}
			}
		}
	);

	const { form: formData, enhance } = form;

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
			class: 'h-fit border-border px-2 py-1 font-semibold'
		})}
	>
		{formatFractionToLocaleCurrency(row.budget)}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Set Budget</Dialog.Title>
			<Dialog.Description>{row.name}</Dialog.Description>
		</Dialog.Header>

		<form method="POST" use:enhance class="space-y-4">
			<input type="hidden" name="categoryId" value={row.id} />
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

			<div class="flex">
				<Dialog.Close
					class={buttonVariants({
						variant: 'secondary'
					})}
				>
					Cancel
				</Dialog.Close>
				<Button type="submit" class="ml-auto text-right">Save</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
