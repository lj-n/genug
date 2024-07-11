<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import { Progress } from '$lib/components/ui/progress';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let goal: number;
	export let rest: number;
	export let name: string;
</script>

<div class="flex flex-col">
	<span>{name}</span>
	<div class="flex gap-2 items-center text-muted-foreground text-xs">
		<Progress max={goal} value={rest} />

        <Feather name="award" />

		<span class="tabular-nums font-semibold whitespace-nowrap">
			Goal: {formatFractionToLocaleCurrency(goal)}
		</span>
	</div>
</div>
