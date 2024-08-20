<script lang="ts">
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { PageData } from './$types';

	export let transaction: PageData['transactions'][number];
</script>

<div class="flex flex-col">
	<span class="text-base font-bold tabular-nums">
		{formatFractionToLocaleCurrency(transaction.flow)}
	</span>
	<span class="text-xs text-muted-foreground"
		>{transaction.description ?? '~'}</span
	>
</div>
