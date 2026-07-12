<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { m } from '$lib/paraglide/messages';
	import { editCategory, getCategoryById } from '$lib/remote-functions/category.remote';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { createSingletonToast } from '$lib/utils/singleton-toast.svelte';
	import { fly } from 'svelte/transition';
	import FloppyDiskDuotoneIcon from '~icons/ph/floppy-disk-duotone';
	import TargetIcon from '~icons/ph/target';

	let {
		category,
		currency
	}: {
		category: Awaited<ReturnType<typeof getCategoryById>>;
		currency: (typeof CURRENCIES)[number];
	} = $props();

	let savedIndicator = createSingletonToast();

	$effect(() => {
		editCategory.fields.targetBalance.set(category.targetBalance ?? 0);
	});

	const flyDuration = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			? 0
			: 200
		: 0;
</script>

<form
	{...editCategory.enhance(async (form) => {
		if (await form.submit()) {
			savedIndicator.trigger();
		}
	})}
	class="flex flex-col gap-2 rounded-md border border-muted/20 bg-background p-3 shadow-xs"
>
	<input {...editCategory.fields.categoryId.as('hidden', category.id)} />

	<Input
		{...editCategory.fields.categoryName.as('text', category.name)}
		class="h-12 text-xl font-semibold"
		placeholder={m.category_label_name()}
		aria-label={m.category_label_name()}
	/>

	{#each editCategory.fields.categoryName.issues() as issue (issue)}
		<p class="pl-1.5 text-sm text-error">{issue.message}</p>
	{/each}

	<Textarea
		{...editCategory.fields.notes.as('text', category.notes ?? '')}
		class="min-h-30 resize-none py-2 text-base"
		placeholder={m.category_placeholder_notes()}
		aria-label={m.category_label_notes()}
	/>

	<InputGroup.Root>
		<InputGroup.InputMoney
			name={editCategory.fields.targetBalance.as('number').name}
			bind:value={
				() => editCategory.fields.targetBalance.value(),
				(v) => editCategory.fields.targetBalance.set(v)
			}
			{currency}
			aria-invalid={editCategory.fields.targetBalance.issues()?.length ? true : undefined}
			class="h-12 text-center text-xl font-semibold placeholder:text-base placeholder:font-normal"
			placeholder={formatMoney({ currency, money: asMoney(0) })}
			aria-label={m.category_label_targetbalance()}
		/>

		<InputGroup.Addon align="block-end">
			<InputGroup.Text class="mx-auto">
				<TargetIcon class="size-6" />
				<span>{m.category_label_targetbalance()}</span>
			</InputGroup.Text>
		</InputGroup.Addon>
	</InputGroup.Root>

	<div class="mt-auto flex items-center justify-end gap-3">
		{#if savedIndicator.show}
			<div
				class="flex items-center gap-1 font-medium text-success"
				transition:fly={{ duration: flyDuration, x: -20 }}
			>
				<FloppyDiskDuotoneIcon />
				<span>{m.saved()}</span>
			</div>
		{/if}

		<Button type="submit" disabled={editCategory.pending > 0}>
			{m.save()}
		</Button>
	</div>
</form>
