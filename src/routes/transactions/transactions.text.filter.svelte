<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { Writable } from 'svelte/store';

	export let filterValue: Writable<string>;
</script>

<Input
	type="text"
	bind:value={$filterValue}
	placeholder="filter..."
	class="h-6 max-w-40 text-xs"
/>
