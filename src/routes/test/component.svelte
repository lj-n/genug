<script lang="ts">
	import { gett } from './context.svelte';

	const ctx = gett();
</script>

<div>
	Component {ctx.timestamp()}
</div>
