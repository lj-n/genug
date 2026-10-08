<!-- PROTOTYPE — throwaway (branch prototype/checkpoint-page, question 2). -->
<script lang="ts">
	import { cn } from 'tailwind-variants';
	import StampIcon from '~icons/ph/stamp';

	import { checkpointHref, sealedCheckpointLabel } from './sealed-prototype.svelte';

	let {
		accountId,
		class: className,
		transfer = false
	}: { accountId: string; class?: string; transfer?: boolean } = $props();

	const locked = $derived(
		transfer ? 'Account, amount, date and validated' : 'Amount, date and validated'
	);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<p class={cn('flex items-center gap-1.5 px-1 text-sm text-muted', className)}>
	<StampIcon class="size-4 shrink-0 text-success" />
	<span>
		{locked} are sealed by the checkpoint on {sealedCheckpointLabel()}.
		<a href={checkpointHref(accountId)} class="text-interactive underline">View checkpoint</a>
	</span>
</p>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
