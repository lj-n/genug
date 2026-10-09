<script lang="ts">
	// Test-only composition for input-money.svelte.test.ts: an empty-mode money
	// input whose bound value is rendered, so tests can observe it.
	import InputMoney from './input-money.svelte';

	let { value = $bindable() }: { value?: number } = $props();
</script>

<InputMoney allowEmpty currency="EUR" name="bankBalance" placeholder="Enter balance" bind:value />
<output>{value === undefined ? 'empty' : value}</output>
