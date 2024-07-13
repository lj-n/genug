<script lang="ts">
	import { createCategoryFormSchema } from './schema';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Select from '$lib/components/ui/select';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Feather from '$lib/components/feather.svelte';
	import {
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import { mediaQuery } from 'svelte-legos';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { getTeam } from '$lib/server/teams';
	import { toast } from 'svelte-sonner';

	export let form: SuperValidated<Infer<typeof createCategoryFormSchema>>;
	export let teams: NonNullable<ReturnType<typeof getTeam>>[];
	export let initialTeamSelect: undefined | number = undefined;

	function toastFromFormMessage(message: App.Superforms.Message) {
		if (message.type === 'error') {
			toast.warning(message.text);
		}
		if (message.type === 'success') {
			toast.success(message.text);
		}
	}

	const createForm = superForm(form, {
		warnings: {
			duplicateId: false
		},
		validators: zodClient(createCategoryFormSchema),
		onUpdated(event) {
			if (event.form.message) {
				toastFromFormMessage(event.form.message);
			}
		},
		onResult(event) {
			if (event.result.type === 'success') {
				open = false;
			}
		}
	});

	const { form: formData, enhance } = createForm;

	$: selected = $formData.teamId
		? {
				value: $formData.teamId,
				label: teams.find((t) => t.id === $formData.teamId)?.name
			}
		: {
				value: initialTeamSelect,
				label: teams.find((t) => t.id === initialTeamSelect)?.name ?? 'Personal'
			};

	const isDesktop = mediaQuery('(min-width: 768px)');

	let open = false;
</script>

{#if $isDesktop}
	<Dialog.Root bind:open>
		<Dialog.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" class="mx-auto mt-4">
				<Feather name="plus" class="mr-2" />
				Create New Category
			</Button>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Create a New Category</Dialog.Title>
			</Dialog.Header>
			<form
				class="grid items-start gap-2"
				method="POST"
				action="/categories?/create"
				use:enhance
			>
				<Form.Field form={createForm} name="name">
					<Form.Control let:attrs>
						<Form.Label>Category Name</Form.Label>
						<Input {...attrs} bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createForm} name="description">
					<Form.Control let:attrs>
						<Form.Label>
							Description
							<span class="text-xs text-muted-foreground"> (optional) </span>
						</Form.Label>
						<Input {...attrs} bind:value={$formData.description} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createForm} name="teamId">
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
								{#each teams as team (team.id)}
									<Select.Item value={team.id} label={team.name} />
								{/each}
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.teamId} name={attrs.name} />
					</Form.Control>
					<Form.Description>
						Only you can see personal categories. Team categories are visible to
						all team members.
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button>
					<Feather name="plus" class="mr-2" />
					Create
				</Form.Button>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" class="mx-auto mt-4">
				<Feather name="plus" class="mr-2" />
				Create New Category
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Create a New Category</Drawer.Title>
			</Drawer.Header>
			<form
				class="grid items-start gap-2 p-2"
				method="POST"
				action="/categories?/create"
				use:enhance
			>
				<Form.Field form={createForm} name="name">
					<Form.Control let:attrs>
						<Form.Label>Category Name</Form.Label>
						<Input {...attrs} bind:value={$formData.name} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createForm} name="description">
					<Form.Control let:attrs>
						<Form.Label>
							Description
							<span class="text-xs text-muted-foreground"> (optional) </span>
						</Form.Label>
						<Input {...attrs} bind:value={$formData.description} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createForm} name="teamId">
					<Form.Control let:attrs>
						<Form.Label>Personal or Team</Form.Label>
						<Select.Root>
							<Select.Trigger {...attrs}>
								<Select.Value placeholder="Select Personal or Team" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value={null} label="Personal" />
								{#each teams as team (team.id)}
									<Select.Item value={team.id} label={team.name} />
								{/each}
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.teamId} name={attrs.name} />
					</Form.Control>
					<Form.Description>
						Only you can see personal categories. Team categories are visible to
						all team members.
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button>
					<Feather name="plus" class="mr-2" />
					Create
				</Form.Button>
			</form>
		</Drawer.Content>
	</Drawer.Root>
{/if}
