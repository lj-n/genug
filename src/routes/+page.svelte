<script lang="ts">
	import { InputCurrency } from '$lib/components/ui/input-currency';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let value = $state('500.55');
</script>

<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->

<InputCurrency bind:value intlConfig={{ currency: 'EUR', locale: 'de' }} />
