<script lang="ts">
	let { categoryName }: { categoryName?: string } = $props();
</script>

<div class="grid size-full items-center justify-items-start">
	{#if categoryName}
		<span class="font-medium">{categoryName}</span>
	{:else}
		<span class="text-muted/80">Without Category</span>
	{/if}
</div>
