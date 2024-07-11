<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import { Progress } from '$lib/components/ui/progress';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { PageData } from './$types';

	export let row: PageData['budget'][number];
</script>

<div class="flex flex-col">
	<span class="font-medium">{row.name}</span>

	{#if row.goal}
		<div class="flex items-center gap-2 text-xs text-muted-foreground">
			<Progress max={row.goal} value={row.rest} />

			<Feather name="award" />

			<span class="whitespace-nowrap font-semibold tabular-nums">
				Goal: {formatFractionToLocaleCurrency(row.goal)}
			</span>
		</div>
	{/if}
</div>
