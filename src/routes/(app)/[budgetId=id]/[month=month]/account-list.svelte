<script lang="ts">
	import { resolve } from '$app/paths';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import PhPiggyBankDuoTone from '~icons/ph/piggy-bank-duotone';

	import type { PageData } from './$types';

	let { accounts }: { accounts: PageData['budget']['accounts'] } = $props();

	const { formatCurrency } = getIntlContext();
</script>

<div class="grid space-y-2">
	<div aria-hidden="true" class="text-sm text-muted">Konten</div>
	<ul class="flex flex-wrap gap-4">
		{#each accounts as account (account.id)}
			<li>
				<a
					href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
						accountId: account.id,
						budgetId: account.budgetId
					})}
					class="group flex min-w-40 flex-col gap-0.5 rounded-md p-2 hover:bg-muted/5"
				>
					<div class="flex items-center gap-2">
						<div aria-hidden="true">
							<PhPiggyBankDuoTone class="text-muted/70" />
						</div>
						{account.name}
					</div>

					<div class="font-currency">{formatCurrency(account.balance)}</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
