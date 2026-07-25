<!-- Desktop glance surface for a category: the budget table's name cell anchors
     a popover with the viewed month's stats and a link to the detail page.
     The popover sits directly on top of the cell — a negative offset equal to the
     cell's own height overlaps it exactly, so the panel replaces ("hides") the
     cell and grows from there (down by default, up when there's no room below).
     That's why the panel repeats the category name before the viewed month. -->
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

	// The panel overlaps its trigger cell exactly: a negative main-axis offset
	// equal to the cell's own height pulls the panel back over the cell (in both
	// flip directions), hiding it. Measured live so it tracks the row density —
	// the same height sizes the panel's title strip, so the name stays put.
	let triggerEl = $state<HTMLElement | null>(null);
	let cellHeight = $state(0);
	$effect(() => {
		if (!triggerEl) return;
		const observer = new ResizeObserver(() => (cellHeight = triggerEl!.offsetHeight));
		observer.observe(triggerEl);
		return () => observer.disconnect();
	});
</script>

<Popover.Root>
	<!-- relative + z on hover/focus: the outline must paint above the target
	     progress bar that overlays the cell's bottom edge. -->
	<Popover.Trigger
		bind:ref={triggerEl}
		class="relative flex size-full cursor-pointer items-center px-2 text-left hover:z-10 hover:bg-surface hover:outline-1 hover:-outline-offset-1 hover:outline-foreground/50 focus-visible:z-10"
		onpointerenter={prefetch}
		onfocus={prefetch}
	>
		{row.name}
	</Popover.Trigger>

	<Popover.Content
		side="bottom"
		align="start"
		sideOffset={-cellHeight}
		motion="fade"
		class="w-(--bits-popover-anchor-width) gap-0 overflow-hidden rounded-xs p-0 shadow-sm ring-1 ring-muted/30"
	>
		<!-- Title strip mirrors the cell: same px-2 inset and height, and the name
		     repeats the cell's exact font (Plex Sans 16px/400/24) so it stays put —
		     no size flicker — when the panel opens over the cell. The muted fill +
		     hairline divider keep this "cell zone" distinct from the stats below. -->
		<div
			class="flex items-center justify-between gap-2 border-b border-muted/20 bg-muted/5 px-2"
			style="min-height: {cellHeight}px"
		>
			<div class="flex min-w-0 items-baseline gap-1.5">
				<!-- font-sans overrides the display (Lora) face that h3 gets by
				     default, so the name matches the cell's Plex Sans exactly. -->
				<h3 class="truncate font-sans text-base leading-6 font-normal">{row.name}</h3>
				<span class="shrink-0 text-xs text-muted">
					{formatMonth({ month, options: { month: 'short', year: 'numeric' } })}
				</span>
			</div>

			<Button size="sm" variant="ghost" href={settingsHref}>
				{m.category_popover_settings()}
				<ArrowRightIcon />
			</Button>
		</div>

		<!-- flex-gap so the sparkline and the stat tiles don't touch (the two are
		     bare siblings out of CategoryStatsMonthly). -->
		<div class="flex flex-col gap-3 p-3">
			<CategoryStatsMonthly categoryId={row.id} {currency} {month} />
		</div>
	</Popover.Content>
</Popover.Root>
