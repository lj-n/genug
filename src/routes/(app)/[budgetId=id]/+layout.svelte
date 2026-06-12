<script lang="ts">
	import { setCurrency } from '$lib/utils/currency';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	setCurrency(() => data.currency);
</script>

{@render children?.()}
