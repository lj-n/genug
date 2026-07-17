<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts, getArchivedAccounts } from '$lib/remote-functions/account.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import ArchiveIcon from '~icons/ph/archive';
	import PiggyBankIcon from '~icons/ph/piggy-bank';
	import PlusIcon from '~icons/ph/plus';

	import { AccountCreate } from '../account';

	const budgetId = getBudgetId();
	const accounts = $derived(await getAccounts(budgetId()));
	const archivedAccounts = $derived(await getArchivedAccounts(budgetId()));

	let open = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<span class="sr-only">{m.account_dropdown_label()}</span>
				<PiggyBankIcon class="size-5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-fit">
		<DropdownMenu.Group>
			<DropdownMenu.Label>
				{m.budget_account_list_accounts_label()}
			</DropdownMenu.Label>

			{#if accounts.length === 0}
				<p class="max-w-52 px-2 py-1.5 text-sm text-muted">
					{m.account_dropdown_empty_hint()}
				</p>
			{/if}

			{#each accounts as account (account.id)}
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a
							href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
								accountId: account.id,
								budgetId: budgetId()
							})}
							{...props}
						>
							{account.name}
						</a>
					{/snippet}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>

		<DropdownMenu.Separator />

		<DropdownMenu.Group>
			<DropdownMenu.Item
				variant="interactive"
				class="justify-center"
				onSelect={() => (open = true)}
			>
				<PlusIcon />
				{m.budget_account_list_add_account()}
			</DropdownMenu.Item>

			<DropdownMenu.Item>
				{#snippet child({ props })}
					<a
						href={resolve('/(app)/[budgetId=id]/accounts/archived', { budgetId: budgetId() })}
						{...props}
					>
						<ArchiveIcon />
						{m.account_archived_link({ amount: archivedAccounts.length })}
					</a>
				{/snippet}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.new_account_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.new_account_description()}</p>
			</Dialog.Description>
		</Dialog.Header>

		<AccountCreate />
	</Dialog.Content>
</Dialog.Root>
