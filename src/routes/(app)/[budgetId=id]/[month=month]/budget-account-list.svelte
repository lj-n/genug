<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhPiggyBankDuoTone from '~icons/ph/piggy-bank-duotone';
	import PhPlus from '~icons/ph/plus';

	import type { PageData } from './$types';

	import { createAccountSchema } from '../accounts/new/schema';

	let {
		accounts,
		budgetId,
		createAccountForm
	}: {
		accounts: PageData['budget']['accounts'];
		budgetId: string;
		createAccountForm: PageData['createAccountForm'];
	} = $props();

	const { formatCurrency, locale, numberFormatOptions } = getIntlContext();

	const form = superForm(
		untrack(() => createAccountForm),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					openCreateAccountForm = false;
				}
			},
			validators: zod4Client(createAccountSchema)
		}
	);

	const { enhance, form: formData } = form;

	let openCreateAccountForm = $state(false);
</script>

<div class="relative grid space-y-1">
	<div>
		<Popover.Root bind:open={openCreateAccountForm}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} size="sm">
						<PhPlus />
						{m.account_create_button()}
					</Button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content align="start" class="flex flex-col gap-2" sideOffset={-30}>
				<form
					class="contents"
					action={resolve('/(app)/[budgetId=id]/accounts/new', { budgetId })}
					use:enhance
					method="POST"
				>
					<Form.Field {form} name="accountName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{m.account_placeholder_name()}</Form.Label>
								<Input {...props} bind:value={$formData.accountName} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="startingBalance">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>{m.account_starting_balance_label()}</Form.Label>
								<InputCurrency
									{...props}
									class="text-right"
									placeholder={formatCurrency(0)}
									intlConfig={{ locale, ...numberFormatOptions }}
									bind:value={$formData.startingBalance}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Button>{m.account_create_button()}</Form.Button>
				</form>
			</Popover.Content>
		</Popover.Root>
	</div>

	<ul class="flex flex-wrap gap-2">
		{#each accounts as account (account.id)}
			<li>
				<a
					href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
						accountId: account.id,
						budgetId: account.budgetId
					})}
					class="group flex min-w-40 flex-col gap-1 rounded-md border border-muted/10 bg-surface p-2 shadow-xs hover:bg-muted/5"
				>
					<div>{account.name}</div>

					<div class="flex items-end gap-2">
						<div aria-hidden="true">
							<PhPiggyBankDuoTone class="text-muted" />
						</div>
						<div class="leading-tight font-currency">{formatCurrency(account.balance)}</div>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
