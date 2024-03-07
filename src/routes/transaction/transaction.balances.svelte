<script lang="ts">
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { getUserAccountsWithBalance } from '$lib/server/account';

	export let accounts: ReturnType<typeof getUserAccountsWithBalance>;
</script>

<div class="rounded border border-ui-normal p-2">
	<table class="table-auto border-collapse w-full text-sm">
		<thead>
			<tr>
				<th
					id="val"
					scope="col"
					class="text-left font-normal text-xs text-muted"
				>
					Validated
				</th>
				<th></th>
				<th
					id="pen"
					scope="col"
					class="text-right font-normal text-xs text-muted"
				>
					Pending
				</th>
				<th></th>
				<th
					id="work"
					scope="col"
					class="text-right font-normal text-xs text-muted"
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
						class="text-left tabular-nums font-bold text-normal"
					>
						{formatFractionToLocaleCurrency(account.validated)}
					</td>
					<td></td>
					<td
						headers="accname pen"
						class="text-right tabular-nums font-bold text-normal"
					>
						{#if account.pending > 0}
							<span class="text-muted">+</span>
						{/if}
						{formatFractionToLocaleCurrency(account.pending)}
					</td>
					<td></td>
					<td
						headers="accname work"
						class="text-right tabular-nums font-bold text-normal"
					>
						<span class="text-muted">=</span>
						{formatFractionToLocaleCurrency(account.working)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
