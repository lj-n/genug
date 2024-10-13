<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { PageData } from './$types';
	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import { createShallowRoute } from '$lib/shallow.routing';
	import { page } from '$app/stores';
	import type { PageData as SetBudgetPageData } from './[id=integer]/$types';
	import SetBudgetPage from './[id=integer]/+page.svelte';

	export let row: PageData['budget'][number];

	const [action, data, isOpen] = createShallowRoute<SetBudgetPageData>();

	const href = `${$page.url.pathname}/${row.id}`;
</script>

<a
	use:action={$page.url}
	{href}
	class={buttonVariants({
		variant: 'outline',
		class: 'h-fit border-border px-2 py-1 text-base font-semibold'
	})}
>
	{formatFractionToLocaleCurrency(row.budget)}
</a>

<ShallowRouteModal open={$isOpen} close={() => history.back()}>
	{#if $data}
		<SetBudgetPage data={$data} />
	{/if}
</ShallowRouteModal>
