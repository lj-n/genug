<script lang="ts">
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { cleanValue } from '@canutin/svelte-currency-input';

	import type { PageData } from './$types';

	let { data }: PageData = $props();

	let value = $state('1255.55');
	let float = $state<null | number>(null);
</script>

<div class="m-auto max-w-lg">
	<pre>{JSON.stringify({ cleanValue: cleanValue({ value }), float, value }, null, 2)}</pre>
	<InputCurrency
		aria-label="Amount"
		name="amount"
		intlConfig={{ currency: 'EUR', locale: data.locale }}
		bind:value
		bind:float
	/>
</div>
