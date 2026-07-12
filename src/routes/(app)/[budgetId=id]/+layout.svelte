<script lang="ts">
	import { setBudgetId } from '$lib/utils/budget-id-context';
	import { stickyParam } from '$lib/utils/sticky-param';

	import type { LayoutProps } from './$types';

	let { children, params }: LayoutProps = $props();

	setBudgetId(stickyParam(() => params.budgetId));
</script>

{@render children?.()}
