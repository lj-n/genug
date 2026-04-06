<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Separator } from '$lib/components/ui/separator';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatCentToFloatString } from '$lib/utils/formatCentToFloatString';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { formatValue } from '@canutin/svelte-currency-input';
	import PhQuestion from '~icons/ph/question';
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

<div class="flex flex-col gap-2">
	<Input
		type="text"
		id="category-name"
		bind:value={category.name}
		class="h-12 text-xl font-semibold"
		placeholder="Category Name"
	/>

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
			class="h-12 text-xl font-semibold placeholder:text-base placeholder:font-normal"
			placeholder="Set a Target Balance"
		/>
		<InputGroup.Addon>
			<PhTarget class="size-6" />
		</InputGroup.Addon>

		<InputGroup.Addon align="inline-end">
			<PhQuestion class="size-6" />
		</InputGroup.Addon>
	</InputGroup.Root>
</div>

<Separator />

<div class="grid grid-cols-2 gap-2 text-foreground/80">
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

<Separator />

<CategoryArchive {category} />

<CategoryDelete {category} />
