<script lang="ts">
	import type { Month } from '$lib/utils/month';
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import { AccountCreate } from '$lib/components/features/account';
	import { CategoryCreate } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { focusRing } from '$lib/components/ui/focus-ring';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { getMonthly } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { cn } from 'tailwind-variants';
	import CheckCircleFillIcon from '~icons/ph/check-circle-fill';
	import CircleIcon from '~icons/ph/circle';

	let { month }: { month: Month } = $props();

	const budgetId = getBudgetId();

	// Both queries are already loaded by this page (account dropdown, category
	// table), so the card costs no extra round-trips.
	const accounts = $derived(await getAccounts(budgetId()));
	const categories = $derived(await getMonthly({ budgetId: budgetId(), month }));

	let accountDialogOpen = $state(false);
	let categoryDialogOpen = $state(false);
</script>

{#snippet step(done: boolean, title: string, action: Snippet)}
	<li class="flex min-h-9 flex-wrap items-center gap-2">
		{#if done}
			<CheckCircleFillIcon class="size-5 shrink-0 text-success" aria-hidden="true" />
		{:else}
			<CircleIcon class="size-5 shrink-0 text-muted" aria-hidden="true" />
		{/if}

		<span class={cn(done && 'text-muted')}>{title}</span>

		{#if done}
			<span class="sr-only">{m.tutorial_card_step_done()}</span>
		{:else}
			<span class="ml-auto">
				{@render action()}
			</span>
		{/if}
	</li>
{/snippet}

{#if accounts.length === 0 || categories.length === 0}
	<section
		aria-label={m.tutorial_card_title()}
		class="flex flex-col gap-3 rounded-md border border-muted/20 bg-surface p-4 shadow-xs"
	>
		<div class="flex flex-col gap-1">
			<h2 class="text-lg font-bold tracking-tight">{m.tutorial_card_title()}</h2>
			<p class="text-sm text-muted">{m.tutorial_card_description()}</p>
		</div>

		<ol class="flex flex-col gap-1">
			{#snippet accountAction()}
				<Button size="sm" onclick={() => (accountDialogOpen = true)}>
					{m.tutorial_card_step_account_action()}
				</Button>
			{/snippet}
			{@render step(accounts.length > 0, m.tutorial_card_step_account(), accountAction)}

			{#snippet categoryAction()}
				<Button size="sm" onclick={() => (categoryDialogOpen = true)}>
					{m.tutorial_card_step_category_action()}
				</Button>
			{/snippet}
			{@render step(categories.length > 0, m.tutorial_card_step_category(), categoryAction)}
		</ol>

		<p class="border-t border-muted/20 pt-3 text-sm text-muted">
			{m.tutorial_card_footer_prefix()}{#if accounts.length > 0}<a
					class={cn('rounded-xs text-interactive underline hover:no-underline', focusRing)}
					href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
						accountId: accounts[0].id,
						budgetId: budgetId()
					})}>{m.tutorial_card_footer_account()}</a
				>{:else}{m.tutorial_card_footer_account()}{/if}{m.tutorial_card_footer_suffix()}
		</p>
	</section>
{/if}

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
