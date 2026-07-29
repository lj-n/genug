<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreCategory } from '$lib/remote-functions/category.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	let { category }: { category: { id: string; name: string } } = $props();

	const form = $derived(restoreCategory.for(category.id));
	// The row leaving the archive list is the success signal — no toast.
	const submit = createFormSubmit(() => form, { toast: {} });
</script>

<form {...submit.attrs}>
	<input {...form.fields.categoryId.as('hidden', category.id)} />
	<Button
		type="submit"
		size="xs"
		variant="link"
		class="px-0"
		loading={submit.pending}
		{@attach submit.anchor}
	>
		{m.category_archive_restore_button()}
	</Button>
</form>
