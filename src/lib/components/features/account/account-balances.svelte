<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { m } from '$lib/paraglide/messages';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { cn } from 'tailwind-variants';
	import PhEquals from '~icons/ph/equals';
	import PhPiggyBankDuoTone from '~icons/ph/piggy-bank-duotone';
	import PhPlus from '~icons/ph/plus';
	import PhSeal from '~icons/ph/seal';
	import PhSealCheckDuotone from '~icons/ph/seal-check-duotone';

	let {
		balances,
		currency
	}: {
		balances: {
			balance: number;
			pending: number;
			validated: number;
		};
		currency: (typeof CURRENCIES)[number];
	} = $props();
</script>

<!-- Below @3xl each entry is a compact label/amount row (operators dropped);
     at @3xl and up the original horizontal validated + pending = balance strip. -->
<div
	class="flex w-full flex-col gap-1 @3xl/main:w-fit @3xl/main:flex-row @3xl/main:flex-wrap @3xl/main:items-center @3xl/main:gap-x-6 @3xl/main:gap-y-2"
>
	<div
		class="flex flex-row-reverse items-center justify-between gap-4 @3xl/main:flex-col @3xl/main:items-start @3xl/main:justify-center @3xl/main:gap-0"
	>
		<div class="font-currency @3xl/main:text-lg">
			{formatMoney({ currency, money: asMoney(balances.validated) })}
		</div>
		<div class="flex items-center gap-0.5 text-sm text-muted">
			<PhSealCheckDuotone class="text-success" />
			<span>{m.account_balance_validated()}</span>
		</div>
	</div>

	<div class="hidden @3xl/main:block">
		<PhPlus class="size-7 text-muted" />
	</div>

	<div
		class="flex flex-row-reverse items-center justify-between gap-4 @3xl/main:flex-col @3xl/main:items-start @3xl/main:justify-center @3xl/main:gap-0"
	>
		<div class="font-currency @3xl/main:text-lg">
			{formatMoney({ currency, money: asMoney(balances.pending) })}
		</div>
		<div class="flex items-center gap-0.5 text-sm text-muted">
			<PhSeal />
			<span>{m.account_balance_pending()}</span>
		</div>
	</div>

	<div class="hidden @3xl/main:block">
		<PhEquals class="size-7 text-muted" />
	</div>

	<div
		class="flex flex-row-reverse items-center justify-between gap-4 @3xl/main:flex-col @3xl/main:items-start @3xl/main:justify-center @3xl/main:gap-0"
	>
		<div class={cn('font-currency @3xl/main:text-lg', balances.balance < 0 && 'text-error')}>
			{formatMoney({ currency, money: asMoney(balances.balance) })}
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
