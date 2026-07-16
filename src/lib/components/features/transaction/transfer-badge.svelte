<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';

	import { m } from '$lib/paraglide/messages';
	import ArrowLeftIcon from '~icons/ph/arrow-left';
	import ArrowRightIcon from '~icons/ph/arrow-right';

	let { transaction }: { transaction: ListTransaction } = $props();

	// Register-relative direction: the outflow leg points at the account the
	// money goes to, the inflow leg at the account it came from (ADR-0015).
	const outflow = $derived(transaction.amount < 0);
</script>

<span
	class="inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm bg-info/10 px-1.5 py-0.5 text-info"
>
	{#if outflow}
		<ArrowRightIcon class="size-3.5 shrink-0" aria-hidden="true" />
	{:else}
		<ArrowLeftIcon class="size-3.5 shrink-0" aria-hidden="true" />
	{/if}
	<span class="sr-only">
		{outflow ? m.transfer_direction_to() : m.transfer_direction_from()}
	</span>
	<span class="truncate">{transaction.counterpartAccountName}</span>
</span>
