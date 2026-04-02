<script lang="ts">
	import { InputCurrency } from '$lib/components/ui/input-currency';

	let value = $state(24.99);
</script>

<div class="m-auto max-w-lg">
	<pre>{JSON.stringify(value, null, 2)}</pre>
	<InputCurrency
		aria-label="Amount"
		name="amount"
		intlConfig={{ currency: 'EUR', locale: 'de-DE' }}
		bind:value
	/>

	<InputCurrency
		aria-label="Amount with prefix and suffix"
		name="amount2"
		intlConfig={{ currency: 'USD', locale: 'en-US' }}
		bind:value
	/>
</div>
