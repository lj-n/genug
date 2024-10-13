<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import LucideSprout from '~icons/lucide/sprout';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	export let sum: number;
</script>

<Card.Root class="flex max-w-xs flex-col">
	<Card.Header>
		<Card.Title>
			<span class="flex items-center">
				<LucideSprout class="mr-2" />
				Sleeping Money
			</span>
		</Card.Title>
		<Card.Description>
			This is the money that you have in your account that is not being used in
			any of the budgets.
		</Card.Description>
	</Card.Header>
	<Card.Content class="mt-auto">
		<div class="text-right text-2xl font-bold tabular-nums">
			{formatFractionToLocaleCurrency(sum)}
		</div>
	</Card.Content>
</Card.Root>
