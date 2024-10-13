<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import LucideSprout from '~icons/lucide/sprout';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let sum: number;
</script>

<div class="flex max-w-xs flex-col border-l pl-8">
	<div class="font-semibold leading-none tracking-tight">
		<span class="flex items-center">
			<LucideSprout class="mr-2" />
			Sleeping Money
		</span>
	</div>

	<p class="mb-6 mt-1.5 text-sm text-muted-foreground">
		This is the money that you have in your account that is not being used in
		any of the budgets.
	</p>

	<div class="text-center text-2xl font-bold tabular-nums">
		{formatFractionToLocaleCurrency(sum)}
	</div>
</div>
