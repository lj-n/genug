<script lang="ts">
	// PROTOTYPE (#334) — throwaway. Three takes on the archive popover replacing
	// the archived-list page, switchable via `?variant=` (see
	// prototype-archive-switcher.svelte). Mounted next to the category title in
	// the budget table header.
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import ArchiveIcon from '~icons/ph/archive';

	import VariantA from './prototype-archive-popover-variant-a.svelte';
	import VariantB from './prototype-archive-popover-variant-b.svelte';
	import VariantC from './prototype-archive-popover-variant-c.svelte';

	const budgetId = getBudgetId();
	const categories = $derived(await getArchivedCategories({ budgetId: budgetId() }));

	const variant = $derived(page.url.searchParams.get('variant')?.toUpperCase() ?? 'A');

	// Trigger height measured live (category-popover.svelte pattern) so variant
	// C's overlay panel can pixel-lock the icon inside its title strip.
	let triggerEl = $state<HTMLElement | null>(null);
	let triggerHeight = $state(0);
	$effect(() => {
		if (!triggerEl) return;
		const observer = new ResizeObserver(() => (triggerHeight = triggerEl!.offsetHeight));
		observer.observe(triggerEl);
		return () => observer.disconnect();
	});
</script>

{#if categories.length > 0}
	<Popover.Root>
		<Popover.Trigger
			bind:ref={triggerEl}
			class={buttonVariants({ size: 'xs', variant: 'ghost' })}
			aria-label={m.category_archived_link({ amount: categories.length })}
		>
			<ArchiveIcon class="size-4" />
		</Popover.Trigger>

		{#if variant === 'B'}
			<VariantB {categories} />
		{:else if variant === 'C'}
			<VariantC {categories} {triggerHeight} />
		{:else}
			<VariantA {categories} />
		{/if}
	</Popover.Root>
{/if}
