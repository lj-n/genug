<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AccountArchive, AccountDelete, AccountEdit } from '$lib/components/features/account';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { currentMonth, toParam } from '$lib/utils/month';
	import { stickyParam } from '$lib/utils/sticky-param';

	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const accountId = stickyParam(() => params.accountId);

	const account = $derived(await getAccount(accountId()));
	const budget = $derived(await getBudget(budgetId()));

	// Archived accounts are managed through the archived list's restore flow, not
	// this page. Archiving here trips the same redirect: the submit refreshes
	// getAccount, populating archivedAt.
	$effect(() => {
		if (account.archivedAt !== null) {
			goto(resolve('/(app)/[budgetId=id]/accounts/archived', { budgetId: budgetId() }));
		}
	});

	const onDeleted = () =>
		goto(
			resolve('/(app)/[budgetId=id]/[month=month]', {
				budgetId: budgetId(),
				month: toParam(currentMonth())
			})
		);
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{account.name}
		</Page.Title>
	</Page.Header>

	<Page.Content class="max-w-xl">
		<div class="space-y-3">
			<AccountEdit {account} />

			<Separator class="mt-6 mb-3" />

			<AccountArchive {account} currency={budget.currency} />

			<Separator class="mt-6 mb-3" />

			<AccountDelete {account} {onDeleted} />
		</div>
	</Page.Content>
</Page.Root>
