<script lang="ts">
	import { setBudgetContext } from '$lib/utils/budget-context';
	import { setIntlContext } from '$lib/utils/intl-context.svelte';
	import { untrack } from 'svelte';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	setIntlContext({
		locale: untrack(() => data.locale),
		numberFormatOptions: {
			currency: untrack(() => data.budget.currency)
		}
	});

	setBudgetContext(() => data.budget);
</script>

{@render children()}
