<script lang="ts">
	import { resolve } from '$app/paths';
	import { AccountCreate } from '$lib/components/features/account';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Collapsible, CollapsibleContent } from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts, getArchivedAccounts } from '$lib/remote-functions/account.remote';
	import { editBudget, getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { CURRENCIES } from '$lib/utils/currencies';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import ArchiveIcon from '~icons/ph/archive';
	import PencilIcon from '~icons/ph/pencil';
	import PlusIcon from '~icons/ph/plus';

	const budgetId = getBudgetId();
	const budget = $derived(await getBudget(budgetId()));
	const accounts = $derived(await getAccounts(budgetId()));
	const archivedAccounts = $derived(await getArchivedAccounts(budgetId()));

	const form = $derived(editBudget.for(budgetId()));
	// Toast-confirms the save without closing the dialog — accounts live here too,
	// so renaming the budget shouldn't dismiss the surface mid-task.
	const submit = createFormSubmit(() => form, { toast: {} });

	let open = $state(false);
	let addOpen = $state(false);

	// Collapse the add-account form when the dialog closes, so reopening starts
	// from the "Add Account" button rather than a half-filled form.
	$effect(() => {
		if (!open) addOpen = false;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="bg-muted/10 hover:bg-muted/20">
				<PencilIcon />
				<span class="sr-only">{m.budget_settings_title()}</span>
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{m.budget_settings_title()}</Dialog.Title>
			<Dialog.Description>{m.budget_settings_description()}</Dialog.Description>
		</Dialog.Header>

		<Dialog.Body class="flex flex-col gap-6">
			<form {...submit.attrs} class="grid gap-2">
				<input {...editBudget.fields.budgetId.as('hidden', budgetId())} />

				<FormField field={editBudget.fields.name} label={m.budget_label_name()}>
					{#snippet input(field)}
						<Input {...field.as('text', budget.name)} />
					{/snippet}
				</FormField>

				<div class="grid gap-0.5">
					<Label>{m.budget_settings_label_currency()}</Label>
					<Select.Root
						type="single"
						{...form.fields.currency.as('select', budget.currency)}
						bind:value={
							() => form.fields.currency.value() ?? budget.currency,
							(v) => form.fields.currency.set(v)
						}
					>
						<Select.Trigger class="font-semibold">
							{form.fields.currency.value() ?? budget.currency}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>{m.budget_settings_available_currencies()}</Select.Label>
								{#each CURRENCIES as currency (currency)}
									<Select.Item value={currency} label={currency} class="font-semibold">
										{currency}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

				<Button type="submit" class="ml-auto" loading={submit.pending} {@attach submit.anchor}>
					{m.save()}
				</Button>
			</form>

			<div class="grid gap-2">
				<div class="font-display text-base font-semibold">
					{m.budget_account_list_accounts_label()}
				</div>

				{#if accounts.length === 0}
					<p class="px-1 text-sm text-muted">{m.account_dropdown_empty_hint()}</p>
				{:else}
					<ul class="grid gap-0.5">
						{#each accounts as account (account.id)}
							<li>
								<a
									href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
										accountId: account.id,
										budgetId: budgetId()
									})}
									onclick={() => (open = false)}
									class="flex items-center rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/10"
								>
									{account.name}
								</a>
							</li>
						{/each}
					</ul>
				{/if}

				<Collapsible bind:open={addOpen}>
					{#if !addOpen}
						<Button
							variant="ghost"
							size="sm"
							class="w-full justify-start hover:bg-muted/10"
							onclick={() => (addOpen = true)}
						>
							<PlusIcon />
							{m.budget_account_list_add_account()}
						</Button>
					{/if}
					<CollapsibleContent>
						<AccountCreate currency={budget.currency} onSuccess={() => (addOpen = false)} />
					</CollapsibleContent>
				</Collapsible>

				{#if archivedAccounts.length > 0}
					<a
						href={resolve('/(app)/[budgetId=id]/accounts/archived', { budgetId: budgetId() })}
						onclick={() => (open = false)}
						class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-muted/10"
					>
						<ArchiveIcon class="size-4" />
						{m.account_archived_link({ amount: archivedAccounts.length })}
					</a>
				{/if}
			</div>
		</Dialog.Body>

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
