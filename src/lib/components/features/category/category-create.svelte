<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getMonthly } from '$lib/remote-functions/budget.remote';
	import { createCategory } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';

	import { Button } from '../../ui/button';
	import { FormBody } from '../../ui/form-body';
	import { FormField } from '../../ui/form-field';
	import { Input } from '../../ui/input';

	let { onSuccess }: { onSuccess?: () => void } = $props();

	const budgetId = getBudgetId();
</script>

<FormBody
	{...createCategory.enhance(async (form) => {
		if (await form.submit().updates(getMonthly)) {
			form.element.reset();
			onSuccess?.();
		}
	})}
>
	<input {...createCategory.fields.budgetId.as('hidden', budgetId())} />

	<FormField field={createCategory.fields.categoryName} label={m.category_label_name()}>
		{#snippet input(field)}
			<Input {...field.as('text')} placeholder={m.category_placeholder_name()} />
		{/snippet}
	</FormField>

	<Button type="submit" class="ml-auto">
		{m.category_create_button()}
	</Button>
</FormBody>
