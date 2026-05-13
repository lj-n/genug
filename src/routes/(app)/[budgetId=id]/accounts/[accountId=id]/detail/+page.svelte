<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import PhArrowFatLeft from '~icons/ph/arrow-fat-left';

	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<Page.Root>
	<Page.Header class="">
		<Button
			variant="ghost"
			class="w-fit"
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
				accountId: data.account.id,
				budgetId: data.budget.id
			})}
		>
			<PhArrowFatLeft class="text-muted" />
			{m.account_back_to_transactions()}
		</Button>

		<Page.Title>
			{data.account.name}
		</Page.Title>
	</Page.Header>

	<Page.Content>hello</Page.Content>
</Page.Root>
