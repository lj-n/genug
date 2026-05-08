<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox, type WithoutChildrenOrChild } from 'bits-ui';
	import PhCircleDashedDuotone from '~icons/ph/circle-dashed-duotone';
	import PhCircleDashedLight from '~icons/ph/circle-dashed-light';
	import PhMinusCircleDuotone from '~icons/ph/minus-circle-duotone';

	let {
		checked = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<Checkbox.RootProps> = $props();
</script>

<div class="grid place-content-center">
	<Label
		class={buttonVariants({
			class: 'rounded-xs hover:bg-transparent',
			size: 'icon-lg',
			variant: 'ghost'
		})}
	>
		<Checkbox.Root bind:checked bind:ref {...restProps} class="cursor-pointer">
			{#snippet children({ checked, indeterminate })}
				{#if checked}
					<PhCircleDashedDuotone class="size-5 text-interactive" />
				{:else if indeterminate}
					<PhMinusCircleDuotone class="size-5 text-interactive" />
				{:else}
					<PhCircleDashedLight class="size-5 text-muted" />
				{/if}
			{/snippet}
		</Checkbox.Root>
	</Label>
</div>
