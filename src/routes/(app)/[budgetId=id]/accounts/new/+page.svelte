<script lang="ts">
	import { AccountCreate } from '$lib/components/features/account';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';

	const budgetId = getBudgetId();

	const { currency } = $derived(await getBudget(budgetId()));
</script>

<Page.Root class="max-w-lg">
	<Page.Header>
		<Page.Title>
			{m.new_account_title()}
		</Page.Title>

		<Page.Description>
			{m.new_account_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<AccountCreate {currency} />
	</Page.Content>
</Page.Root>
