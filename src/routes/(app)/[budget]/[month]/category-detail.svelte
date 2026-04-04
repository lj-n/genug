<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatCentToFloatString } from '$lib/utils/formatCentToFloatString';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { formatValue } from '@canutin/svelte-currency-input';
	import PhTarget from '~icons/ph/target';

	import type { PageData } from './$types';

	import CategoryArchive from './category-detail-archive.svelte';
	import CategoryDelete from './category-detail-delete.svelte';

	let { category }: { category: PageData['categories'][number] } = $props();

	const { locale, numberFormatOptions } = getIntlContext();

	let formatCurrency = $derived((value: number) =>
		formatValue({
			intlConfig: { locale, ...numberFormatOptions },
			value: formatCentToFloatString(value)
		})
	);
</script>

<div class="flex flex-col gap-0.5">
	<label for="category-name" class="text-sm font-medium">Category Name</label>
	<Input
		type="text"
		id="category-name"
		bind:value={category.name}
		class="h-12 text-xl font-semibold"
	/>
</div>

<Textarea
	id="category-notes"
	bind:value={category.notes}
	class="min-h-30 resize-none py-2 text-base"
	placeholder="Add some notes..."
/>

<InputGroup.Root>
	<InputGroup.InputCurrency
		bind:value={category.targetBalance}
		intlConfig={{ locale, ...numberFormatOptions }}
		class="h-12 text-xl font-semibold"
	/>
	<InputGroup.Addon align="block-end">
		<InputGroup.Text class="w-full justify-between">
			Set a Target Balance
			<PhTarget class="size-6" />
		</InputGroup.Text>
	</InputGroup.Addon>
</InputGroup.Root>

<CategoryArchive {category} />

<CategoryDelete {category} />
