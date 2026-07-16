<script lang="ts">
	import { resolve } from '$app/paths';
	import { AccountCreate } from '$lib/components/features/account';
	import { CategoryCreate } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { EmptyState } from '$lib/components/ui/empty-state';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import CheckBoldIcon from '~icons/ph/check-bold';
	import RocketLaunchIcon from '~icons/ph/rocket-launch';

	const budgetId = getBudgetId();

	// Shared with the account dropdown's query — the checkmark costs no extra round-trip.
	const accounts = $derived(await getAccounts(budgetId()));
	const hasAccount = $derived(accounts.length > 0);

	let accountDialogOpen = $state(false);
	let categoryDialogOpen = $state(false);
</script>

<EmptyState
	icon={RocketLaunchIcon}
	title={m.budget_getting_started_title()}
	description={m.budget_getting_started_description()}
>
	{#snippet action()}
		<ol class="flex w-full max-w-md flex-col gap-2 text-left">
			<li
				class="flex min-h-14 items-center gap-3 rounded-xs border border-muted/20 bg-muted/3 px-4 py-2"
			>
				<span
					class="grid size-6 shrink-0 place-items-center rounded-full border border-muted/30 text-xs font-medium text-muted"
				>
					{#if hasAccount}
						<CheckBoldIcon class="size-3.5 text-success" />
						<span class="sr-only">{m.budget_getting_started_step_done()}</span>
					{:else}
						1
					{/if}
				</span>
				{#if hasAccount}
					<span class="text-muted">{m.budget_getting_started_step_account()}</span>
				{:else}
					<Button onclick={() => (accountDialogOpen = true)}>
						{m.budget_getting_started_step_account()}
					</Button>
				{/if}
			</li>

			<li
				class="flex min-h-14 items-center gap-3 rounded-xs border border-muted/20 bg-muted/3 px-4 py-2"
			>
				<span
					class="grid size-6 shrink-0 place-items-center rounded-full border border-muted/30 text-xs font-medium text-muted"
				>
					2
				</span>
				<!-- Same breakpoint split as the quick actions: link to the standalone
				     page on the phone, dialog on wider screens. -->
				<Button
					href={resolve('/(app)/[budgetId=id]/categories/new', { budgetId: budgetId() })}
					class="md:hidden"
				>
					{m.budget_getting_started_step_category()}
				</Button>
				<Button class="hidden md:flex" onclick={() => (categoryDialogOpen = true)}>
					{m.budget_getting_started_step_category()}
				</Button>
			</li>
		</ol>
	{/snippet}
</EmptyState>

<Dialog.Root bind:open={accountDialogOpen}>
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

<Dialog.Root bind:open={categoryDialogOpen}>
	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.new_category_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.new_category_description()}</p>
			</Dialog.Description>
		</Dialog.Header>

		<CategoryCreate onSuccess={() => (categoryDialogOpen = false)} />
	</Dialog.Content>
</Dialog.Root>
