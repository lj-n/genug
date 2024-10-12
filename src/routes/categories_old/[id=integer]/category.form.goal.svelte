<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import {
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import { goalFormSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createToastFromFormMessage } from '$lib/utils';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency
	} from '$lib/components/utils';
	import type { PageData } from './$types';
	import { Progress } from '$lib/components/ui/progress';
	import LucideGoal from '~icons/lucide/goal';

	import LucidePackagePlus from '~icons/lucide/package-plus';

	export let data: SuperValidated<Infer<typeof goalFormSchema>>;
	export let budget: PageData['budget'];

	const form = superForm(data, {
		validators: zodClient(goalFormSchema),
		resetForm: false,
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
				<LucideGoal class="mr-2" />
				Category Goal
			</span>
		</Card.Title>
		<Card.Description>
			Set a goal for available funds in this category to help you track your
			progress.
		</Card.Description>
	</Card.Header>
	<form action="?/goal" method="post" use:enhance>
		<Card.Content>
			<div
				class="mb-4 flex flex-col gap-2 transition-opacity"
				class:opacity-100={$formData.goalAmount > 0}
				class:opacity-30={$formData.goalAmount === 0}
			>
				<div class="flex justify-between text-sm">
					<div class="flex flex-col">
						<span class="flex items-center gap-2 font-semibold tabular-nums">
							<LucidePackagePlus />
							{formatFractionToLocaleCurrency(budget.rest)}
						</span>
						<span class="text-xs text-muted-foreground">
							Currently Available Funds
						</span>
					</div>

					<div class="flex flex-col items-end">
						<span class="flex items-center gap-2 font-semibold tabular-nums">
							<LucideGoal />
							{formatFractionToLocaleCurrency($formData.goalAmount)}
						</span>
						<span class="text-xs text-muted-foreground"> Your Goal </span>
					</div>
				</div>

				<Progress max={$formData.goalAmount} value={budget.rest} />
			</div>

			<Form.Field {form} name="goalAmount">
				<Form.Control let:attrs>
					<Form.Label>
						Your Goal
						<span class="text-xs text-muted-foreground">
							(Set 0 to remove)
						</span>
					</Form.Label>
					<Input {...attrs} type="number" bind:value={$formData.goalAmount} />
				</Form.Control>
				<Form.Description class="flex flex-col">
					{currencyInputProps.information}
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>

		<Card.Footer class="flex justify-end">
			<Form.Button>Set Goal</Form.Button>
		</Card.Footer>
	</form>
</Card.Root>
