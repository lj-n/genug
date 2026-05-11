<script lang="ts">
	import type { LabelProps } from 'formsnap';

	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from 'bits-ui';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let {
		'aria-label': ariaLabel = undefined,
		checked = $bindable(false),
		disabled = false,
		...props
	}: LabelProps & { 'aria-label'?: string; checked?: boolean; disabled?: boolean } = $props();
</script>

<Label
	class={buttonVariants({
		class: 'rounded-xs hover:bg-transparent',
		size: 'icon-lg',
		variant: 'ghost'
	})}
	{...props}
>
	<Checkbox.Root aria-label={ariaLabel} bind:checked class="cursor-pointer" {disabled}>
		{#snippet children({ checked })}
			{#if checked}
				<PhSealCheckDuotone class="size-6 text-success" />
			{:else}
				<PhSeal class="size-6 text-muted" />
			{/if}
		{/snippet}
	</Checkbox.Root>
</Label>
