<script lang="ts">
	import { page } from '$app/stores';
	import { buttonVariants } from '$lib/components/ui/button';
	import { createShallowRoute } from '$lib/shallow.routing';
	import type { PageData } from './$types';
	import LucideEdit from '~icons/lucide/edit';

	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import EditTransactionPage from './[id=integer]/+page.svelte';
	import type { PageData as EditTransactionPageData } from './[id=integer]/$types';

	export let transaction: PageData['transactions'][number];

	const [action, data, isOpen] = createShallowRoute<EditTransactionPageData>();
</script>

<a
	href="/transactions/{transaction.id}"
	use:action={$page.url}
	class={buttonVariants({
		variant: 'ghost',
		size: 'icon'
	})}
>
	<LucideEdit class="text-muted-foreground hover:text-foreground" />
	<span class="sr-only"> Edit This Transaction </span>
</a>

<ShallowRouteModal open={$isOpen} close={() => history.back()}>
	{#if $data}
		<EditTransactionPage data={$data} />
	{/if}
</ShallowRouteModal>
