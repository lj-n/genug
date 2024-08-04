<script lang="ts">
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let stats: PageData['stats'];
	export let budget: PageData['budget'];
</script>

<h3 class="text-lg font-semibold leading-none tracking-tight">Details</h3>

<div class="flex gap-12">
	<div class="flex flex-col">
		<span class="text-xl font-bold tabular-nums">
			{formatFractionToLocaleCurrency(stats.transactionSum)}
		</span>
		<span class="text-sm text-muted-foreground">
			Sum of Transactions Flow
		</span>
	</div>

	<div class="flex flex-col">
		<span class="text-xl font-bold tabular-nums">
			{formatFractionToLocaleCurrency(stats.budgetSum)}
		</span>
		<span class="text-sm text-muted-foreground"> Sum of Budget Amounts </span>
	</div>

	<div class="flex flex-col">
		<span class="text-xl font-bold tabular-nums">
			{stats.transactionCount}
		</span>
		<span class="text-sm text-muted-foreground">Transactions</span>
	</div>

	{#if budget}
		<div class="flex flex-col">
			<span class="text-xl font-bold tabular-nums">
				{formatFractionToLocaleCurrency(budget.rest)}
			</span>
			<span class="text-sm text-muted-foreground"
				>Currently Available Funds</span
			>
		</div>
	{/if}
</div>

<Separator class="mb-8 mt-2" />
