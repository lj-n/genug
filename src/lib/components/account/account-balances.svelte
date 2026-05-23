<script lang="ts">
	import type { AccountBalances } from '$lib/components/transaction-table/types';

	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { cn } from 'tailwind-variants';
	import PhEquals from '~icons/ph/equals';
	import PhPlus from '~icons/ph/plus';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let { balances }: { balances: AccountBalances } = $props();

	const intlContext = getIntlContext();
</script>

<div class="flex w-fit items-center gap-6 rounded-md bg-muted/5 p-3">
	<div class="flex flex-col items-start justify-center">
		<div class="text-lg font-currency">{intlContext.formatCurrency(balances.validated)}</div>
		<div class="flex items-center gap-0.5 text-sm text-muted">
			<PhSealCheckDuotone class="text-success" />
			<span>{m.account_balance_validated()}</span>
		</div>
	</div>

	<div>
		<PhPlus class="size-7 text-muted" />
	</div>

	<div class="flex flex-col items-start justify-center">
		<div class="text-lg font-currency">{intlContext.formatCurrency(balances.pending)}</div>
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
			{intlContext.formatCurrency(balances.balance)}
		</div>
		<div class={cn('text-sm text-info', balances.balance < 0 && 'text-foreground')}>
			<span>{m.account_balance()}</span>
		</div>
	</div>
</div>
