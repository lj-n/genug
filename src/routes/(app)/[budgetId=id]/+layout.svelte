<script lang="ts">
	import { setBudgetContext } from '$lib/utils/budget-context';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	setBudgetContext(() => data.budget);
</script>

{@render children()}
