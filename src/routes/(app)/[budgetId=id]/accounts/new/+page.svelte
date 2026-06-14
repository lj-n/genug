<script lang="ts">
	import { page } from '$app/state';
	import { AccountCreate } from '$lib/components/account';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';

	const budgetId = $derived(page.params.budgetId!);
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
		<AccountCreate {budgetId} />
	</Page.Content>
</Page.Root>
