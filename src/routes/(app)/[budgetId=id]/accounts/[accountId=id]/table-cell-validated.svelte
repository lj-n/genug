<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from 'bits-ui';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let { isValidated }: { isValidated: boolean } = $props();
</script>

<div class="grid size-full place-content-center">
	<Label
		class={buttonVariants({
			class: 'rounded-xs hover:bg-transparent',
			size: 'icon-lg',
			variant: 'ghost'
		})}
	>
		<Checkbox.Root checked={isValidated} class="cursor-pointer">
			{#snippet children({ checked })}
				{#if checked}
					<PhSealCheckDuotone class="size-6 text-success" />
				{:else}
					<PhSeal class="size-6 text-muted" />
				{/if}
			{/snippet}
		</Checkbox.Root>
	</Label>
</div>
