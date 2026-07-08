<script lang="ts">
	import { AccountCreate } from '$lib/components/features/account';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
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
		<AccountCreate />
	</Page.Content>
</Page.Root>
