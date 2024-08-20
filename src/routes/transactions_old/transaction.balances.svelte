<script lang="ts">
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { getAccountsWithBalance } from '$lib/server/accounts';

	export let accounts: ReturnType<typeof getAccountsWithBalance>;
</script>

<div class="border-ui-normal rounded border p-2">
	<table class="w-full table-auto border-collapse text-sm">
		<thead>
			<tr>
				<th
					id="val"
					scope="col"
					class="text-left text-xs font-normal text-muted"
				>
					Validated
				</th>
				<th></th>
				<th
					id="pen"
					scope="col"
					class="text-right text-xs font-normal text-muted"
				>
					Pending
				</th>
				<th></th>
				<th
					id="work"
					scope="col"
					class="text-right text-xs font-normal text-muted"
				>
					Working
				</th>
			</tr>
		</thead>
		<tbody>
			{#each accounts as account}
				<tr>
					<th
						id="accname"
						colspan="5"
						scope="colgroup"
						class="text-left font-normal"
					>
						{account.name}
					</th>
				</tr>

				<tr>
					<td
						headers="accname val"
						class="text-normal text-left font-bold tabular-nums"
					>
						{formatFractionToLocaleCurrency(account.validated)}
					</td>
					<td></td>
					<td
						headers="accname pen"
						class="text-normal text-right font-bold tabular-nums"
					>
						{#if account.pending > 0}
							<span class="text-muted">+</span>
						{/if}
						{formatFractionToLocaleCurrency(account.pending)}
					</td>
					<td></td>
					<td
						headers="accname work"
						class="text-normal text-right font-bold tabular-nums"
					>
						<span class="text-muted">=</span>
						{formatFractionToLocaleCurrency(account.working)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
