<script lang="ts">
	// PROTOTYPE (#334) — throwaway. One restore affordance per archived
	// category; `style` selects the per-variant look. Wired to the real
	// `restoreCategory` remote function so the restored row visibly returns to
	// the budget table.
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { restoreCategory } from '$lib/remote-functions/category.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import HandWithdrawIcon from '~icons/ph/hand-withdraw';

	let {
		category,
		style
	}: {
		category: { archivedAt: Date | null; id: string; name: string };
		style: 'labeled' | 'link' | 'row';
	} = $props();

	const form = $derived(restoreCategory.for(category.id));
	// The item leaving the popover list is the success signal — no toast.
	const submit = createFormSubmit(() => form, { toast: {} });
</script>

{#if style === 'labeled'}
	<form {...submit.attrs}>
		<input {...form.fields.categoryId.as('hidden', category.id)} />
		<Button type="submit" size="xs" loading={submit.pending} {@attach submit.anchor}>
			<HandWithdrawIcon class="size-3" />
			{m.category_archive_restore_button()}
		</Button>
	</form>
{:else if style === 'link'}
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
{:else}
	<form {...submit.attrs} class="w-full">
		<input {...form.fields.categoryId.as('hidden', category.id)} />
		<button
			type="submit"
			class="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-1 text-left hover:bg-interactive/10 focus-visible:bg-interactive/10 focus-visible:outline-none"
			{@attach submit.anchor}
		>
			<span class="line-clamp-1">{category.name}</span>
			<span
				class="flex items-center gap-1 text-xs text-muted group-hover:text-interactive group-focus-visible:text-interactive"
			>
				<HandWithdrawIcon class="size-3.5" />
				{m.category_archive_restore_button()}
			</span>
		</button>
	</form>
{/if}
