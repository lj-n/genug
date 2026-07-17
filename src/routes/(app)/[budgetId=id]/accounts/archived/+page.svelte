<script lang="ts">
	import { resolve } from '$app/paths';
	import { EmptyState } from '$lib/components/ui/empty-state';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedAccounts } from '$lib/remote-functions/account.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { formatDate } from '$lib/utils/format-date';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import RestoreAccountForm from './restore-account-form.svelte';

	const budgetId = getBudgetId();

	const accounts = $derived(await getArchivedAccounts(budgetId()));
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{m.account_archive_title()}</Page.Title
		>
		<Page.Description>
			<ArchiveIcon class="inline size-6" />
			{m.account_archive_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		{#if accounts.length === 0}
			<EmptyState icon={ArchiveIcon} title={m.account_archive_empty()} />
		{:else}
			<ul class="space-y-2">
				{#each accounts as account (account.id)}
					<li animate:flip={{ duration: 300 }}>
						<div class="group flex rounded-md border border-muted/20 bg-surface p-2 shadow-xs">
							<div class="flex flex-col gap-1">
								<a
									href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
										accountId: account.id,
										budgetId: account.budgetId
									})}
									class="hover:underline"
								>
									{account.name}
								</a>
								<span class="flex items-center gap-1 text-sm text-muted">
									<ArchiveIcon />
									{formatDate({
										date: new Date(account.archivedAt!),
										options: { dateStyle: 'medium', timeStyle: 'short' }
									})}
								</span>
							</div>
							<div
								class="ml-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
							>
								<RestoreAccountForm accountId={account.id} budgetId={account.budgetId} />
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Page.Content>
</Page.Root>
