<script lang="ts">
	import type { Month } from '$lib/utils/month';
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { AccountCreate } from '$lib/components/features/account';
	import { CategoryCreate } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import { focusRing } from '$lib/components/ui/focus-ring';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { getBudget, getMonthly, getUnassigned } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { cn } from 'tailwind-variants';
	import CheckCircleFillIcon from '~icons/ph/check-circle-fill';
	import CircleIcon from '~icons/ph/circle';
	import PiggyBankIcon from '~icons/ph/piggy-bank';
	import StackIcon from '~icons/ph/stack';

	let { month }: { month: Month } = $props();

	const budgetId = getBudgetId();

	// All three queries are already loaded by this page (account dropdown,
	// category table, page header), so the card costs no extra round-trips.
	// `currency` is resolved here so AccountCreate's dialog opens without a
	// suspending await — see the note in account-create.svelte.
	const accounts = $derived(await getAccounts(budgetId()));
	const categories = $derived(await getMonthly({ budgetId: budgetId(), month }));
	const { currency } = $derived(await getBudget(budgetId()));

	let accountDialogOpen = $state(false);
	let categoryDialogOpen = $state(false);
</script>

{#snippet step(done: boolean, title: string, action: Snippet)}
	<li class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			{#if done}
				<CheckCircleFillIcon class="size-5 shrink-0 text-success" aria-hidden="true" />
			{:else}
				<CircleIcon class="size-5 shrink-0 text-muted" aria-hidden="true" />
			{/if}

			<span class={cn(done && 'text-muted')}>{title}</span>

			{#if done}
				<span class="sr-only">{m.tutorial_card_step_done()}</span>
			{/if}
		</div>

		{#if !done}
			<div class="pl-7">
				{@render action()}
			</div>
		{/if}
	</li>
{/snippet}

{#if accounts.length === 0 || categories.length === 0}
	<section
		aria-label={m.tutorial_card_title()}
		class="flex flex-col gap-3 rounded-md border border-info/30 bg-info/5 p-4 shadow-xs shadow-info/15"
	>
		<div class="flex flex-col gap-1">
			<h2 class="text-lg font-semibold">{m.tutorial_card_title()}</h2>
			<p class="text-sm text-muted">{m.tutorial_card_description()}</p>
		</div>

		<ol class="flex flex-col gap-3">
			{#snippet accountAction()}
				<Button size="sm" onclick={() => (accountDialogOpen = true)}>
					<PiggyBankIcon />
					{m.tutorial_card_step_account_action()}
				</Button>
			{/snippet}
			{@render step(accounts.length > 0, m.tutorial_card_step_account(), accountAction)}

			{#snippet categoryAction()}
				<Button size="sm" onclick={() => (categoryDialogOpen = true)}>
					<StackIcon />
					{m.tutorial_card_step_category_action()}
				</Button>
			{/snippet}
			{@render step(categories.length > 0, m.tutorial_card_step_category(), categoryAction)}
		</ol>

		<p class="border-t border-info/20 pt-3 text-sm text-muted">
			{m.tutorial_card_footer_prefix()}{#if accounts.length > 0}<a
					class={cn('rounded-xs text-interactive underline hover:no-underline', focusRing)}
					href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
						accountId: accounts[0].id,
						budgetId: budgetId()
					})}>{accounts[0].name}</a
				>{:else}{m.tutorial_card_footer_account()}{/if}{m.tutorial_card_footer_suffix()}
		</p>
	</section>
{/if}

<ResponsiveModal.Root bind:open={accountDialogOpen}>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.new_account_title()}</ResponsiveModal.Title>
			<ResponsiveModal.Description class="grid gap-4">
				<p>{m.new_account_description()}</p>
			</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<AccountCreate
				{currency}
				onSuccess={() => (accountDialogOpen = false)}
				updates={() => [getUnassigned({ budgetId: budgetId(), month })]}
			/>
		</ResponsiveModal.Body>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>

<ResponsiveModal.Root bind:open={categoryDialogOpen}>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.new_category_title()}</ResponsiveModal.Title>
			<ResponsiveModal.Description class="grid gap-4">
				<p>{m.new_category_description()}</p>
			</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<CategoryCreate onSuccess={() => (categoryDialogOpen = false)} />
		</ResponsiveModal.Body>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
