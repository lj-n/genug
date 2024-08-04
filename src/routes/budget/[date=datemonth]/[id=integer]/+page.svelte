<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { setBudgetFormSchema } from './schema';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency
	} from '$lib/components/utils';
	import LucidePackage from '~icons/lucide/package';
	import { Separator } from '$lib/components/ui/separator';

	import LucidePackageOpen from '~icons/lucide/package-open';
	import LucidePackagePlus from '~icons/lucide/package-plus';
	import LucidePackageMinus from '~icons/lucide/package-minus';

	export let data: PageData;
	$: ({ id, name } = data.budget);

	const form = superForm(data.form, {
		validators: zodClient(setBudgetFormSchema),
		onResult(event) {}
	});

	const { form: formData, enhance, constraints } = form;
</script>

<form method="POST" use:enhance class="flex flex-col space-y-4">
	<input type="hidden" name="categoryId" value={id} />

	<div class="space-y-1">
		<h2 class="font-semibold leading-none tracking-tight">
			{name}
		</h2>
		<span class="text-xs text-muted-foreground">Budget {data.localDate}</span>
	</div>

	<div class="flex space-x-2 text-sm">
		<div class="flex items-center gap-2" title="This Month's Activity">
			<LucidePackageOpen class="text-muted-foreground" />
			<span class="font-semibold tabular-nums">
				{formatFractionToLocaleCurrency(data.budget.activity)}
			</span>
		</div>

		<Separator orientation="vertical" />

		<div
			class="flex items-center gap-2"
			title="This Month's Currently Available Money"
		>
			{#if data.budget.rest < 0}
				<LucidePackageMinus class="text-muted-foreground" />
			{:else}
				<LucidePackagePlus class="text-muted-foreground" />
			{/if}
			<span class="font-semibold tabular-nums">
				{formatFractionToLocaleCurrency(data.budget.rest)}
			</span>
		</div>
	</div>

	<Form.Field {form} name="budget">
		<Form.Control let:attrs>
			<Form.Label>Amount</Form.Label>
			<Input {...attrs} type="number" bind:value={$formData.budget} />
		</Form.Control>
		<Form.Description>{currencyInputProps.information}</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button>
		<LucidePackage class="mr-2" />
		Set Budget
	</Form.Button>
</form>
