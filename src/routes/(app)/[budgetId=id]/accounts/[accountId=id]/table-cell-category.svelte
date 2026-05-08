<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	let { categoryName }: { categoryName?: string } = $props();
</script>

<div class="grid size-full items-center justify-items-start">
	{#if categoryName}
		<span class="font-medium">{categoryName}</span>
	{:else}
		<span class="text-muted/80">{m.transactions_table_without_category()}</span>
	{/if}
</div>
