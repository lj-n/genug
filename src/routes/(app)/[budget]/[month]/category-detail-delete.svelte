<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { m } from '$lib/paraglide/messages';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';

	import type { PageData } from './$types';

	let { category }: { category: PageData['categories'][number] } = $props();
</script>

<section class="grid space-y-3">
	<h2 class="text-lg font-semibold">{m.category_section_title_delete()}</h2>

	<p class="rounded-md bg-error/10 p-2 text-error">
		<ParaglideMessage
			message={m.category_delete_info}
			inputs={{
				assignments: category.totalAssignedBudgetCount,
				transactions: category.totalRelatedTransactionCount
			}}
		>
			{#snippet b({ children })}
				<b>{@render children?.()}</b>
			{/snippet}
		</ParaglideMessage>
	</p>

	<Button variant="destructive" class="ml-auto">
		{m.category_delete_button()}
	</Button>
</section>
