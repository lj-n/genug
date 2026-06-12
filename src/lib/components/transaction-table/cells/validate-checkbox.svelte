<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let {
		checked = $bindable(false),
		disabled = false,
		...restProps
	}: HTMLInputAttributes = $props();
</script>

<Label
	class={buttonVariants({
		class: 'rounded-xs hover:bg-transparent',
		size: 'icon-lg',
		variant: 'ghost'
	})}
>
	<input type="checkbox" bind:checked {disabled} {...restProps} class="sr-only cursor-pointer" />
	{#if checked}
		<PhSealCheckDuotone class="size-6 text-success" />
	{:else}
		<PhSeal class="size-6 text-muted" />
	{/if}
</Label>
