<script lang="ts">
	import { resolve } from '$app/paths';
	import { AccountCreate } from '$lib/components/features/account';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts, getArchivedAccounts } from '$lib/remote-functions/account.remote';
	import { editBudget, getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { CURRENCIES } from '$lib/utils/currencies';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { currencySymbol } from '$lib/utils/money';
	import ArchiveIcon from '~icons/ph/archive';
	import PencilIcon from '~icons/ph/pencil';
	import PlusIcon from '~icons/ph/plus';

	import AccountArchiveDialog from './account-archive-dialog.svelte';

	const budgetId = getBudgetId();
	const budget = $derived(await getBudget(budgetId()));
	const accounts = $derived(await getAccounts(budgetId()));
	const archivedAccounts = $derived(await getArchivedAccounts(budgetId()));

	const form = $derived(editBudget.for(budgetId()));
	// The save toast-confirms without closing the dialog — accounts live here
	// too, so renaming the budget shouldn't dismiss the surface mid-task.
	const submit = createFormSubmit(() => form, { toast: {} });

	let open = $state(false);
	let addOpen = $state(false);
	let archiveOpen = $state(false);

	// The stacked dialogs must never outlive their dismissed parent.
	$effect(() => {
		if (!open) {
			addOpen = false;
			archiveOpen = false;
		}
	});
</script>

<ResponsiveModal.Root bind:open>
	<ResponsiveModal.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon">
				<PencilIcon />
				<span class="sr-only">{m.budget_settings_title()}</span>
			</Button>
		{/snippet}
	</ResponsiveModal.Trigger>

	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.budget_settings_title()}</ResponsiveModal.Title>
			<ResponsiveModal.Description>{m.budget_settings_description()}</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body class="flex flex-col gap-6">
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
						{@const selected = form.fields.currency.value() ?? budget.currency}
						<Select.Trigger class="w-40">
							<span class="flex items-center gap-1.5">
								{selected}
								<span class="text-muted">{currencySymbol(selected)}</span>
							</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>{m.budget_settings_available_currencies()}</Select.Label>
								{#each CURRENCIES as currency (currency)}
									<Select.Item value={currency} label={currency}>
										<span class="flex items-center gap-1.5">
											{currency}
											<span class="text-muted">{currencySymbol(currency)}</span>
										</span>
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
				<div class="flex items-center gap-1">
					<div class="font-display text-base font-semibold">
						{m.budget_account_list_accounts_label()}
					</div>
					<Button
						size="xs"
						class="ml-1"
						aria-label={m.budget_account_list_add_account()}
						onclick={() => (addOpen = true)}
					>
						<PlusIcon class="size-4" />
					</Button>
					{#if archivedAccounts.length > 0}
						<Button
							variant="ghost"
							size="xs"
							aria-label={m.account_archived_link({ amount: archivedAccounts.length })}
							onclick={() => (archiveOpen = true)}
						>
							<ArchiveIcon class="size-4" />
						</Button>
					{/if}
				</div>

				{#if accounts.length === 0 && archivedAccounts.length === 0}
					<p class="px-1 text-sm text-muted">{m.account_dropdown_empty_hint()}</p>
				{:else if accounts.length > 0}
					<ul class="grid list-disc gap-1 pl-6 text-sm marker:text-muted/50">
						{#each accounts as account (account.id)}
							<li>
								<a
									href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
										accountId: account.id,
										budgetId: budgetId()
									})}
									onclick={() => (open = false)}
									class="text-foreground underline-offset-3 hover:underline"
								>
									{account.name}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</ResponsiveModal.Body>

		<ResponsiveModal.Footer>
			<ResponsiveModal.Close class={buttonVariants({ variant: 'ghost' })}>
				{m.dialog_close()}
			</ResponsiveModal.Close>
		</ResponsiveModal.Footer>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>

<!--
	Create Account stacks over Budget Settings as a sibling root, not nested
	inside the settings `Dialog.Content`: our `Dialog.Content` renders its
	children through a snippet, so a nested `Dialog.Root` would be instantiated
	outside bits' content context and never open.
-->
<Dialog.Root bind:open={addOpen}>
	<!-- Lighter scrim so the settings dialog stays present behind; the `class`
	     drops AccountCreate's card chrome so the fields sit flat on the dialog
	     surface. -->
	<Dialog.Content class="sm:max-w-md" overlayClass="bg-background/30">
		<Dialog.Header>
			<Dialog.Title>{m.new_account_title()}</Dialog.Title>
		</Dialog.Header>
		<Dialog.Body>
			<AccountCreate
				currency={budget.currency}
				onSuccess={() => (addOpen = false)}
				class="rounded-none bg-transparent p-0"
			/>
		</Dialog.Body>
	</Dialog.Content>
</Dialog.Root>

<AccountArchiveDialog accounts={archivedAccounts} bind:open={archiveOpen} />
