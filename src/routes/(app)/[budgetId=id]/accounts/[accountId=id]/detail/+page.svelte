<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getAccountById } from '$lib/remote-functions/account.remote';
	import PhArrowFatLeft from '~icons/ph/arrow-fat-left';

	const accountId = $derived(page.params.accountId!);
	const budgetId = $derived(page.params.budgetId!);

	const account = $derived(await getAccountById({ accountId }));
</script>

<Page.Root>
	<Page.Header class="">
		<Button
			variant="ghost"
			class="w-fit"
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
				accountId,
				budgetId
			})}
		>
			<PhArrowFatLeft class="text-muted" />
			{m.account_back_to_transactions()}
		</Button>

		<Page.Title>
			{account.name}
		</Page.Title>
	</Page.Header>

	<Page.Content>hello</Page.Content>
</Page.Root>
