<script lang="ts">
	import { gett } from './context.svelte';

	const ctx = gett();
</script>

<div>
	Other
	{#key ctx.ding}
		<span>{new Date().toISOString()}</span>
	{/key}
</div>
