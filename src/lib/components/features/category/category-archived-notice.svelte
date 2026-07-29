<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreCategory } from '$lib/remote-functions/category.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import ArchiveIcon from '~icons/ph/archive';
	import HandWithdrawIcon from '~icons/ph/hand-withdraw';

	let { categoryId, onRestored }: { categoryId: string; onRestored?: () => void } = $props();

	const form = $derived(restoreCategory.for(categoryId));

	const submit = createFormSubmit(() => form, { onSuccess: () => onRestored?.(), toast: {} });
</script>

<section
	class="flex flex-col items-center gap-3 rounded-md border border-muted/20 bg-muted/5 p-8 text-center"
>
	<ArchiveIcon class="size-10 text-muted" />

	<h2 class="font-semibold">{m.category_archived_notice_title()}</h2>

	<p class="max-w-prose text-muted">{m.category_archived_notice_description()}</p>

	<form {...submit.attrs}>
		<input {...form.fields.categoryId.as('hidden', categoryId)} />
		<Button type="submit" loading={submit.pending} {@attach submit.anchor}>
			<HandWithdrawIcon class="size-4" />
			{m.category_archive_restore_button()}
		</Button>
	</form>
</section>
