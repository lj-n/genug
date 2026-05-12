<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from 'bits-ui';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let { checked = $bindable(false), disabled = false, ...props }: Checkbox.RootProps = $props();
</script>

<Label
	class={buttonVariants({
		class: 'rounded-xs hover:bg-transparent',
		size: 'icon-lg',
		variant: 'ghost'
	})}
>
	<Checkbox.Root bind:checked class="cursor-pointer" {disabled} {...props}>
		{#snippet children({ checked })}
			{#if checked}
				<PhSealCheckDuotone class="size-6 text-success" />
			{:else}
				<PhSeal class="size-6 text-muted" />
			{/if}
		{/snippet}
	</Checkbox.Root>
</Label>
