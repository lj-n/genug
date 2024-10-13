<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import LucideFileSpreadsheet from '~icons/lucide/file-spreadsheet';

	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { getAccountsWithBalance } from '$lib/server/accounts';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import LucideGripVertical from '~icons/lucide/grip-vertical';
	import { invalidateAll } from '$app/navigation';
	import { createUUID } from '$lib/utils';
	import { flip } from 'svelte/animate';

	export let accounts: ReturnType<typeof getAccountsWithBalance>;

	function handleSort({
		detail
	}: CustomEvent<DndEvent<ReturnType<typeof getAccountsWithBalance>[number]>>) {
		console.log(detail.items);
		accounts = detail.items;
	}

	async function handleFinalize({
		detail
	}: CustomEvent<DndEvent<ReturnType<typeof getAccountsWithBalance>[number]>>) {
		try {
			accounts = detail.items;

			await fetch('/accounts?/saveOrder', {
				method: 'POST',
				body: JSON.stringify({ order: detail.items.map((c) => c.id) }),
				headers: { 'x-sveltekit-action': 'true' }
			});

			invalidateAll();
		} catch (err) {
			console.error(err);
		}
	}

	const flipDurationMs = 200;
</script>

<div class="flex flex-col w-full">
	<div class="font-semibold leading-none tracking-tight">
		<span class="flex items-center">
			<LucideFileSpreadsheet class="mr-2" />
			Accounts
		</span>
	</div>

	<p class="text-sm text-muted-foreground mb-6 mt-1.5">
		See pending transactions and future account balances.
	</p>

	<div
		class="grid grid-cols-[1fr_1fr_1fr_1fr_1.25rem] gap-8 text-sm text-muted-foreground"
	>
		<span class="self-end font-medium">Account</span>
		<span class="self-end text-right font-semibold">Current Balance</span>
		<span class="self-end text-right font-semibold">Pending Transactions</span>
		<span class="self-end text-right font-semibold">Future Balance</span>
	</div>
	<div
		class="flex flex-col text-sm"
		use:dragHandleZone={{
			type: 'accounts',
			items: accounts,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: [
				'outline-dashed',
				'outline-1',
				'outline-blue',
				'dark:outline-blue-light',
				'rounded'
			],
			transformDraggedElement(el) {
				const wrapper = el?.querySelector('[data-dragging-wrapper]');
				wrapper?.classList.add(
					'bg-background',
					'hover:bg-background',
					'outline-dashed',
					'outline-1',
					'outline-blue',
					'dark:outline-blue-light',
					'rounded'
				);

				el?.classList.add('outline-none');
			}
		}}
		on:consider={handleSort}
		on:finalize={handleFinalize}
	>
		{#each accounts as account (account.id)}
			<div animate:flip={{ duration: flipDurationMs }}>
				<div
					data-dragging-wrapper
					class="grid grid-cols-[1fr_1fr_1fr_1fr_1.25rem] gap-8 border-t py-1 hover:bg-muted/50"
				>
					<span class="font-medium">{account.name}</span>
					<span class="text-right font-semibold tabular-nums">
						{formatFractionToLocaleCurrency(account.validated)}
					</span>
					<span class="text-right font-semibold tabular-nums">
						{formatFractionToLocaleCurrency(account.pending)}
					</span>
					<span class="text-right font-semibold tabular-nums">
						{formatFractionToLocaleCurrency(account.working)}
					</span>

					<div
						class="flex w-full items-center justify-end gap-0.5 px-2 text-xs"
					>
						<button
							class="text-muted-foreground hover:text-yellow dark:hover:text-yellow-light"
							use:dragHandle
						>
							<LucideGripVertical />
							<span class="sr-only">Reorder Account</span>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
