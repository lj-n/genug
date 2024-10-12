<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import {
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import { createCategoryFormSchema } from '../create/schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createToastFromFormMessage } from '$lib/utils';

	import LucideFolderPen from '~icons/lucide/folder-pen';

	export let data: SuperValidated<Infer<typeof createCategoryFormSchema>>;

	const form = superForm(data, {
		validators: zodClient(createCategoryFormSchema),
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<Card.Root class="grow">
	<Card.Header>
		<Card.Title>
			<span class="flex items-center">
				<LucideFolderPen class="mr-2" />
				Update Category
			</span>
		</Card.Title>
		<Card.Description>
			Change the name and description of this category.
		</Card.Description>
	</Card.Header>
	<form action="?/update" method="post" use:enhance>
		<Card.Content>
			<Form.Field {form} name="categoryName">
				<Form.Control let:attrs>
					<Form.Label>Category Name</Form.Label>
					<Input {...attrs} bind:value={$formData.categoryName} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="categoryDescription">
				<Form.Control let:attrs>
					<Form.Label>
						Description
						<span class="text-xs text-muted-foreground"> (optional) </span>
					</Form.Label>
					<Input {...attrs} bind:value={$formData.categoryDescription} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>

		<Card.Footer class="flex justify-end">
			<Form.Button>Update</Form.Button>
		</Card.Footer>
	</form>
</Card.Root>
