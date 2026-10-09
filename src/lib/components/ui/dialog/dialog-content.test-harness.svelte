<script lang="ts">
	// Test-only composition for dialog-content.svelte.test.ts: an open dialog
	// with a field to focus before the deferred open auto-focus fires.
	import * as Dialog from './index.js';

	let { open = $bindable(true) }: { open?: boolean } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Harness</Dialog.Title>
		<input aria-label="Amount" />
	</Dialog.Content>
</Dialog.Root>
