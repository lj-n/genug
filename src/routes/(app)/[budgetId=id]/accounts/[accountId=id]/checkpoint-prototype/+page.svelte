<!-- PROTOTYPE — throwaway (branch prototype/checkpoint-page).
     Question: what should the Checkpoint page (ADR-0017) look like?
     Chosen direction: variant E2 ("Calm: summary inline") — enter the bank
     balance, see the Adjustment needed, set the checkpoint; no error hunting.
     Round 5 picked F1 (left-aligned, explained, bank input as the sum's last line).
     Round 6 picked L4 (placeholder inside the empty input).
     Round 7: Adjustment under the line as the result; amber-tinted empty input, no icon.
     Round 8 picked the placeholder: "Enter balance" in Lora italic.
     Reads the account's real transactions once; every action stays in memory. -->
<script lang="ts">
	import { getAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { stickyParam } from '$lib/utils/sticky-param';

	import type { PageProps } from './$types';

	import ProtoPanel from './proto-panel.svelte';
	import { ProtoCheckpointState } from './proto-state.svelte';
	import ProtoSwitcher from './proto-switcher.svelte';
	import VariantF1 from './variant-f1.svelte';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const accountId = stickyParam(() => params.accountId);

	const account = $derived(await getAccount(accountId()));
	const budget = $derived(await getBudget(budgetId()));
	const rows = $derived(
		(await listTransactions({ accountId: accountId(), categoryId: [], page: 1, pageSize: 1000 }))
			.transactions
	);

	// One in-memory state per load; reload resets everything.
	const proto = $derived(new ProtoCheckpointState(rows));
</script>

<VariantF1
	accountId={accountId()}
	accountName={account.name}
	budgetId={budgetId()}
	cp={proto}
	currency={budget.currency}
/>

<ProtoPanel currency={budget.currency} cp={proto} />

<!-- Question 3 locked: phone layout M1 (stacked, full-width input). -->
<ProtoSwitcher labels={{ M1: 'Phone: stacked, full-width input' }} />
