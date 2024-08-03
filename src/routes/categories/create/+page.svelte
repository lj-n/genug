<script lang="ts">
	import type { PageData } from './$types';
	import { createCategoryFormSchema } from './schema';
	import * as Select from '$lib/components/ui/select';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import Feather from '$lib/components/feather.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createToastFromFormMessage } from '$lib/utils';

	export let data: PageData;

	const form = superForm(data.form, {
		validators: zodClient(createCategoryFormSchema),
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		},
		onResult(event) {
			if (event.result.type === 'redirect') {
				createToastFromFormMessage({
					type: 'success',
					text: 'Category created successfully'
				});
			}
		}
	});

	const { form: formData, enhance } = form;

	$: selected = $formData.teamId
		? {
				value: $formData.teamId,
				label: data.teams.find((t) => t.id === $formData.teamId)?.name
			}
		: {
				value: data.initialTeamSelect,
				label:
					data.teams.find((t) => t.id === data.initialTeamSelect)?.name ??
					'Personal'
			};
</script>

<form class="mx-auto grid max-w-md items-start gap-2" method="POST" use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label>Category Name</Form.Label>
			<Input {...attrs} bind:value={$formData.name} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control let:attrs>
			<Form.Label>
				Description
				<span class="text-xs text-muted-foreground"> (optional) </span>
			</Form.Label>
			<Input {...attrs} bind:value={$formData.description} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="teamId">
		<Form.Control let:attrs>
			<Form.Label>Personal or Team</Form.Label>
			<Select.Root
				{selected}
				onSelectedChange={(v) => {
					v && ($formData.teamId = v.value);
				}}
			>
				<Select.Trigger {...attrs}>
					<Select.Value placeholder="Select Personal or Team" />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value={null} label="Personal" />
					{#each data.teams as team (team.id)}
						<Select.Item value={team.id} label={team.name} />
					{/each}
				</Select.Content>
			</Select.Root>
			<input hidden bind:value={$formData.teamId} name={attrs.name} />
		</Form.Control>
		<Form.Description>
			Only you can see personal categories. Team categories are visible to all
			team members.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>
		<Feather name="plus" class="mr-2" />
		Create
	</Form.Button>
</form>
