<script lang="ts">
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import { cn } from '$lib/utils';

	export let sum: number;
</script>

<span
	class={cn(
		sum < 0
			? 'text-orange dark:text-orange-light'
			: 'text-green dark:text-green-light'
	)}
>
	{formatFractionToLocaleCurrency(sum)}
</span>
