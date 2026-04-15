<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhArchive from '~icons/ph/archive';
	import PhListPlus from '~icons/ph/list-plus';

	import { createCategorySchema } from '../categories/new/schema';

	type BudgetActionsProps = {
		archivedAmount: number;
		budgetId: string;
		form: SuperValidated<Infer<typeof createCategorySchema>>;
	};

	let { archivedAmount, budgetId, form: createForm }: BudgetActionsProps = $props();

	const form = superForm(
		untrack(() => createForm),
		{
			validators: zod4Client(createCategorySchema)
		}
	);

	const { enhance, form: formData } = form;
</script>

<ButtonGroup.Root>
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button {...props}>
					<PhListPlus class="size-6" />
					{m.category_create_button()}
				</Button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content align="end" class="w-fit p-2">
			<form
				use:enhance
				action={resolve('/(app)/[budgetId=id]/categories/new', { budgetId })}
				method="POST"
				class="flex gap-1"
			>
				<Form.Field {form} name="categoryName" class="space-y-0">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								bind:value={$formData.categoryName}
								placeholder={m.category_placeholder_name()}
								aria-label={m.category_label_name()}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button>
					{m.category_create_button()}
				</Form.Button>
			</form>
		</Popover.Content>
	</Popover.Root>

	<Button variant="ghost" href={resolve('/(app)/[budgetId=id]/categories/archived', { budgetId })}>
		<PhArchive class="size-6" />
		{m.category_archived_link({ amount: archivedAmount })}
	</Button>
</ButtonGroup.Root>
