<script lang="ts">
	import { getIntlContext } from '$lib/utils/intl-context.svelte';

	let { date }: { date: string } = $props();

	const { formatDate } = getIntlContext();
</script>

<div class="grid size-full items-center justify-end">
	<span>
		{formatDate(new Date(date), {
			day: 'numeric',
			month: 'short',
			year: '2-digit'
		})}
	</span>
</div>
