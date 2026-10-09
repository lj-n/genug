<script lang="ts">
	import { resolve } from '$app/paths';
	import { AccountArchivedNotice } from '$lib/components/features/account';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCheckpointOverview } from '$lib/remote-functions/checkpoint.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { stickyParam } from '$lib/utils/sticky-param';
	import ArrowLeftIcon from '~icons/ph/arrow-left';

	import type { PageProps } from './$types';

	import CheckpointSet from './checkpoint-set.svelte';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const accountId = stickyParam(() => params.accountId);

	const account = $derived(await getAccount(accountId()));
	const budget = $derived(await getBudget(budgetId()));
	// Awaited here rather than in the form: restoring an archived account in
	// place must not introduce a first-time await mid-update, which leaves the
	// fragment blank in production builds (see the account page).
	const overview = $derived(await getCheckpointOverview(accountId()));
</script>

<Page.Root>
	<Page.Header>
		<a
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
				accountId: accountId(),
				budgetId: budgetId()
			})}
			class="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
		>
			<ArrowLeftIcon />
			{account.name}
		</a>
		<Page.Title>{m.checkpoint_title()}</Page.Title>
		{#if !account.archivedAt}
			<Page.Description class="max-w-prose">
				{m.checkpoint_intro({ name: account.name })}
			</Page.Description>
			<Page.Description class="max-w-prose">
				{m.checkpoint_intro_adjustment()}
			</Page.Description>
		{/if}
	</Page.Header>

	<Page.Content class="grid max-w-xl gap-8 pt-4">
		{#if account.archivedAt}
			<AccountArchivedNotice accountId={accountId()} />
		{:else}
			<CheckpointSet accountId={accountId()} currency={budget.currency} {overview} />
		{/if}
	</Page.Content>
</Page.Root>
