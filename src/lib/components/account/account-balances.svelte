<script lang="ts">
	import type { AccountBalances } from '$lib/components/transaction-table/types';

	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { cn } from 'tailwind-variants';
	import PhEquals from '~icons/ph/equals';
	import PhPiggyBankDuoTone from '~icons/ph/piggy-bank-duotone';
	import PhPlus from '~icons/ph/plus';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let { balances }: { balances: AccountBalances } = $props();

	const getBudget = getBudgetContext();
	const currency = $derived(getBudget().currency);
</script>

<div class="flex w-fit items-center gap-6 rounded-md bg-muted/5 p-3">
	<div class="flex flex-col items-start justify-center">
		<div class="text-lg font-currency">
			{formatCurrency({ centValue: balances.validated, currency })}
		</div>
		<div class="flex items-center gap-0.5 text-sm text-muted">
			<PhSealCheckDuotone class="text-success" />
			<span>{m.account_balance_validated()}</span>
		</div>
	</div>

	<div>
		<PhPlus class="size-7 text-muted" />
	</div>

	<div class="flex flex-col items-start justify-center">
		<div class="text-lg font-currency">
			{formatCurrency({ centValue: balances.pending, currency })}
		</div>
		<div class="flex items-center gap-0.5 text-sm text-muted">
			<PhSeal />
			<span>{m.account_balance_pending()}</span>
		</div>
	</div>

	<div>
		<PhEquals class="size-7 text-muted" />
	</div>

	<div class="flex flex-col items-start justify-center">
		<div class={cn('text-lg font-currency', balances.balance < 0 && 'text-error')}>
			{formatCurrency({ centValue: balances.balance, currency })}
		</div>
		<div
			class={cn(
				'flex items-center gap-0.5 text-sm text-info',
				balances.balance < 0 && 'text-foreground'
			)}
		>
			<PhPiggyBankDuoTone />
			<span>{m.account_balance()}</span>
		</div>
	</div>
</div>
