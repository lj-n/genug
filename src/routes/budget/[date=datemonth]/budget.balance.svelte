<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import LucideSprout from '~icons/lucide/sprout';
	import LucideTimer from '~icons/lucide/timer';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import { formatDistanceToNow } from 'date-fns';

	export let sum: number;

	let lastUpdate = new Date();
	let lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });

	let timer = setInterval(() => {
		lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });
	}, 1000);

	$: if (sum) {
		clearInterval(timer);
		lastUpdate = new Date();
		timer = setInterval(() => {
			lastUpdated = formatDistanceToNow(lastUpdate, { addSuffix: true });
		}, 1000);
	}
</script>

<Card.Root class="ml-auto hidden max-w-sm md:block">
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
	<Card.Content>
		<div class="text-right text-xl font-bold tabular-nums">
			{formatFractionToLocaleCurrency(sum)}
		</div>
		<div
			class="mt-4 flex justify-end gap-1 text-xs font-semibold text-muted-foreground"
		>
			<LucideTimer />
			Last Updated: {lastUpdated}
		</div>
	</Card.Content>
</Card.Root>
