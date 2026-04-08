<script lang="ts">
	import type { HTMLLiAttributes } from 'svelte/elements';

	import { fade, slide } from 'svelte/transition';
	import PhArrowElbowDownRight from '~icons/ph/arrow-elbow-down-right';
	import PhArrowFatRightDuotone from '~icons/ph/arrow-fat-right-duotone';

	let {
		class: className,
		isActive,
		showSubIndicator = false
	}: HTMLLiAttributes & {
		class?: string;
		isActive: boolean;
		showSubIndicator?: boolean;
	} = $props();
</script>

{#if isActive}
	<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }} class={className}>
		<div transition:fade={{ duration: 200 }} class="pr-2">
			<PhArrowFatRightDuotone class="size-4 text-info" />
		</div>
	</div>
{:else if showSubIndicator}
	<div aria-hidden="true" transition:slide={{ axis: 'x', duration: 200 }} class={className}>
		<div transition:fade={{ duration: 200 }} class="pr-2">
			<PhArrowElbowDownRight class="size-3 text-muted" />
		</div>
	</div>
{/if}
