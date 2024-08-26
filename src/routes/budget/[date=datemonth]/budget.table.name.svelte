<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { PageData } from './$types';

	import LucideGoal from '~icons/lucide/goal';

	export let row: PageData['budget'][number];
</script>

<div class="flex flex-col">
	<span class="font-medium">{row.name}</span>

	{#if row.goal}
		<div class="flex items-center gap-2 text-sm text-blue dark:text-blue-light">
			<Progress max={row.goal} value={row.rest} />

			<LucideGoal />

			<span class="whitespace-nowrap font-semibold tabular-nums">
				{formatFractionToLocaleCurrency(row.goal)}
			</span>
		</div>
	{/if}
</div>
