<script lang="ts">
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
</script>

{@render children()}
