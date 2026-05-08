<script lang="ts">
	import { getIntlContext } from '$lib/utils/intl-context.svelte';

	let { amount }: { amount: number } = $props();

	const { formatCurrency } = getIntlContext();
</script>

<div class="flex size-full items-center justify-end font-currency">
	{formatCurrency(amount)}
</div>
