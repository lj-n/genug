<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { InputCurrency } from '$lib/components/ui/input-currency';

	let value = $state(24.99);
</script>

<InputCurrency
	class="m-auto max-w-lg"
	aria-label="Amount"
	name="amount"
	intlConfig={{ currency: 'EUR', locale: 'de-DE' }}
	bind:value
/>
<div class="m-auto max-w-lg rounded-md border border-muted/10 bg-surface p-8 shadow-md">
	<h1 class="text-2xl font-bold tracking-tighter">Currency Input Example</h1>
	<pre class="my-8">{JSON.stringify(value, null, 2)}</pre>

	<InputCurrency
		aria-label="Amount with prefix and suffix"
		name="amount2"
		intlConfig={{ currency: 'USD', locale: 'en-US' }}
		bind:value
	/>

	<div class="mt-6 flex justify-between">
		<Button variant="ghost">Cancel</Button>
		<Button>Save</Button>
	</div>
</div>
