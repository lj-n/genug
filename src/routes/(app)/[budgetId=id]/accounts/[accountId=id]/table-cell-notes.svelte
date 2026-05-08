<script lang="ts">
	let { notes }: { notes: string } = $props();
</script>

<div class="grid size-full items-center justify-items-start">
	<span class="truncate">{notes}</span>
</div>
