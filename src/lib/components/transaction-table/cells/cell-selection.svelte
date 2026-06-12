<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import PhCircleDashedDuotone from '~icons/ph/circle-dashed-duotone';
	import PhCircleDashedLight from '~icons/ph/circle-dashed-light';
	import PhMinusCircleDuotone from '~icons/ph/minus-circle-duotone';

	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		checked = $bindable(false),
		indeterminate = false,
		disabled = false,
		onCheckedChange,
		...restProps
	}: {
		indeterminate?: boolean;
		onCheckedChange?: (e: Event) => void;
	} & HTMLInputAttributes = $props();

	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (inputEl) inputEl.indeterminate = indeterminate;
	});
</script>

<div class="grid place-content-center">
	<Label
		class={buttonVariants({
			class: 'rounded-xs hover:bg-transparent',
			size: 'icon-lg',
			variant: 'ghost'
		})}
	>
		<input
			type="checkbox"
			bind:checked
			bind:this={inputEl}
			{disabled}
			{...restProps}
			aria-checked={checked || indeterminate}
			aria-disabled={disabled}
			onchange={onCheckedChange}
			class="sr-only cursor-pointer"
		/>
		{#if checked}
			<PhCircleDashedDuotone class="size-5" />
		{:else if indeterminate}
			<PhMinusCircleDuotone class="size-5" />
		{:else}
			<PhCircleDashedLight class="size-5" />
		{/if}
	</Label>
</div>
