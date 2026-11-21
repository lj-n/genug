<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';

	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';
	import StampIcon from '~icons/ph/stamp';

	import { sealedDate, sealingCheckpointHistoryHref } from './sealed';

	let { class: className, transaction }: { class?: string; transaction: ListTransaction } =
		$props();

	const date = $derived(sealedDate(transaction));
</script>

<!-- The href is resolved in checkpointHistoryHref; only the #history anchor is appended. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<p class={cn('flex items-center gap-1.5 px-1 text-sm text-muted', className)}>
	<StampIcon class="size-4 shrink-0 text-success" />
	<span>
		{transaction.transferId
			? m.checkpoint_sealed_transfer_note({ date })
			: m.checkpoint_sealed_note({ date })}
		<a href={sealingCheckpointHistoryHref(transaction)} class="text-interactive underline">
			{m.checkpoint_sealed_view()}
		</a>
	</span>
</p>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
