<script lang="ts">
	import { columns, MonthTable } from '$lib/components/month-table';
	import { formatValue } from '@canutin/svelte-currency-input';

	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	let intlConfig = $derived({
		currency: data.budget.currency,
		locale: data.locale
	});
</script>

<MonthTable {columns} data={data.month} />
