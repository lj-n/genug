<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreCategory } from '$lib/remote-functions/category.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { currentMonth, toParam } from '$lib/utils/month';
	import PhHandWithdraw from '~icons/ph/hand-withdraw';

	let { budgetId, categoryId }: { budgetId: string; categoryId: string } = $props();

	const form = $derived(restoreCategory.for(categoryId));

	// The item visibly leaving the list is the success signal — no toast.
	const submit = createFormSubmit(() => form, {
		onSuccess: async () => {
			// Let the list's flip animation finish before navigating away.
			await new Promise((r) => setTimeout(r, 300));
			goto(
				resolve('/(app)/[budgetId=id]/[month=month]', {
					budgetId,
					month: toParam(currentMonth())
				})
			);
		},
		toast: {}
	});
</script>

<form {...submit.attrs}>
	<input {...form.fields.categoryId.as('hidden', categoryId)} />
	<Button type="submit" loading={submit.pending} {@attach submit.anchor}>
		<PhHandWithdraw class="size-4" />
		{m.category_archive_restore_button()}
	</Button>
</form>
