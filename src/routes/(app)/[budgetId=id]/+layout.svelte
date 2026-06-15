<script lang="ts">
	import { setBudgetId } from '$lib/utils/budget-id-context';

	import type { LayoutProps } from './$types';

	let { children, params }: LayoutProps = $props();

	setBudgetId(() => params.budgetId);
</script>

{@render children?.()}
