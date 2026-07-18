<!-- Desktop glance surface for a category: the budget table's name cell anchors
     a popover with the viewed month's stats and a link to the detail page.
     The anchored cell already shows the name, so the popover carries none. -->
<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { resolve } from '$app/paths';
	import { CategoryStatsMonthly } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getCategoryStats } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { type CURRENCIES } from '$lib/utils/currencies';
	import { formatMonth } from '$lib/utils/month';
	import ArrowRightIcon from '~icons/ph/arrow-right';

	let {
		currency,
		month,
		row
	}: {
		currency: (typeof CURRENCIES)[number];
		month: Month;
		row: { id: string; name: string };
	} = $props();

	const budgetId = getBudgetId();
	const settingsHref = $derived(
		resolve('/(app)/[budgetId=id]/categories/[categoryId=id]', {
			budgetId: budgetId(),
			categoryId: row.id
		})
	);

	// Warm the stats cache before the popover opens so the content's top-level
	// await resolves instantly instead of suspending the open animation.
	function prefetch() {
		void getCategoryStats({ categoryId: row.id, month });
	}
</script>

<Popover.Root>
	<Popover.Trigger
		class="flex size-full cursor-pointer items-center px-2 text-left -outline-offset-2 hover:bg-surface hover:outline-2 hover:outline-interactive/60"
		onpointerenter={prefetch}
		onfocus={prefetch}
	>
		{row.name}
	</Popover.Trigger>

	<Popover.Content align="start" sideOffset={1} class="w-(--bits-popover-anchor-width) gap-3 p-3">
		<div class="flex items-center justify-between gap-2">
			<h3 class="text-sm font-semibold">
				{formatMonth({ month, options: { month: 'long', year: 'numeric' } })}
			</h3>

			<Button size="sm" href={settingsHref}>
				{m.category_popover_settings()}
				<ArrowRightIcon />
			</Button>
		</div>

		<CategoryStatsMonthly categoryId={row.id} {currency} {month} />
	</Popover.Content>
</Popover.Root>
