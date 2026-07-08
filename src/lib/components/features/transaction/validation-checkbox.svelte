<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { buttonVariants } from '$lib/components/ui/button';
	import { focusRingWithin } from '$lib/components/ui/focus-ring';
	import { Label } from '$lib/components/ui/label';
	import SealIcon from '~icons/ph/seal';
	import SealCheckDuotoneIcon from '~icons/ph/seal-check-duotone';

	let {
		checked = $bindable(false),
		disabled = false,
		...restProps
	}: HTMLInputAttributes = $props();
</script>

<Label
	class={buttonVariants({
		class: `relative cursor-pointer rounded-xs hover:bg-transparent ${focusRingWithin}`,
		size: 'icon-lg',
		variant: 'ghost'
	})}
>
	<input
		type="checkbox"
		bind:checked
		{disabled}
		{...restProps}
		aria-label="Validated"
		class="absolute inset-0 z-10 cursor-pointer opacity-0"
	/>
	{#if checked}
		<SealCheckDuotoneIcon class="size-6 text-success" aria-hidden="true" />
	{:else}
		<SealIcon class="size-6 text-muted" aria-hidden="true" />
	{/if}
</Label>
