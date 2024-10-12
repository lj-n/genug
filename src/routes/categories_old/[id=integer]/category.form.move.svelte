<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import {
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import type { moveTransactionsFormSchema } from './schema';
	import { createToastFromFormMessage } from '$lib/utils';
	import LucideFolderInput from '~icons/lucide/folder-input';

	export let data: SuperValidated<Infer<typeof moveTransactionsFormSchema>>;
	export let categories: PageData['otherCategories'];
	export let category: PageData['category'];

	const form = superForm(data, {
		resetForm: true,
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		}
	});

	const { enhance, form: formData } = form;

	$: availableCategories = categories.filter(
		(c) => !c.retired && c.team?.id === category.team?.id
	);

	$: selectedCategory = $formData.newCategoryId
		? {
				label: availableCategories.find((c) => c.id === $formData.newCategoryId)
					?.name,
				value: $formData.newCategoryId
			}
		: undefined;
</script>

<Card.Root class="grow">
	<Card.Header>
		<Card.Title>
			<span class="flex items-center">
				<LucideFolderInput class="mr-2" />
				Move Transactions to Another Category
			</span>
		</Card.Title>
		<Card.Description>
			Move all transaction related to this category to another existing
			category. <span class="font-bold text-foreground"
				>This action cannot be undone!</span
			>
		</Card.Description>
	</Card.Header>

	<form action="?/moveTransactions" method="post" use:enhance>
		<Card.Content>
			<Form.Field {form} name="newCategoryId">
				<Form.Control let:attrs>
					<Form.Label>New Category</Form.Label>
					<Select.Root
						selected={selectedCategory}
						onSelectedChange={(v) => {
							v && ($formData.newCategoryId = v.value);
						}}
					>
						<Select.Trigger {...attrs}>
							<Select.Value placeholder="Select a new category..." />
						</Select.Trigger>
						<Select.Content>
							{#each availableCategories as c}
								<Select.Item value={c.id} label={c.name} />
							{/each}
						</Select.Content>
					</Select.Root>
					<input
						hidden
						bind:value={$formData.newCategoryId}
						name={attrs.name}
					/>
				</Form.Control>
				<Form.Description>
					Only categories within the same team are available.
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>

		<Card.Footer class="flex justify-end">
			<Form.Button variant="destructive">Move Transactions</Form.Button>
		</Card.Footer>
	</form>
</Card.Root>
