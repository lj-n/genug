<script lang="ts">
	import { formatCentToFloatString } from '$lib/utils/formatCentToFloatString';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { formatValue } from '@canutin/svelte-currency-input';

	import type { PageData } from './$types';

	type CategoryDetailProps = {
		category: PageData['category'];
	};

	let { category }: CategoryDetailProps = $props();

	const { locale, numberFormatOptions } = getIntlContext();

	let formatCurrency = $derived((value: number) =>
		formatValue({
			intlConfig: { locale, ...numberFormatOptions },
			value: formatCentToFloatString(value)
		})
	);
</script>

<div class="grid h-fit grid-cols-2 gap-2 text-foreground/80">
	<div class="rounded-md border border-info/20 bg-info/10 p-2 text-center">
		<div class="text-xl font-bold tabular-nums">
			{formatCurrency(category.totalRelatedTransactionSum)}
		</div>
		<div class="text-sm">Bisher ausgegeben</div>
	</div>
	<div class="rounded-md border border-info/20 bg-info/10 p-2 text-center">
		<div class="text-xl font-bold tabular-nums">{category.totalRelatedTransactionCount}</div>
		<div class="text-sm">Anzahl der Transaktionen</div>
	</div>
</div>
