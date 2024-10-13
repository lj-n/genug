<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';

	import type { PageData } from './$types';
	import { dragHandleZone, dragHandle, type DndEvent } from 'svelte-dnd-action';
	import LucideGripVertical from '~icons/lucide/grip-vertical';

	import { flip } from 'svelte/animate';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';

	type Accounts = PageData['accounts'];
	type Account = Accounts[number];

	export let accounts: Accounts;
	export let onDrop: (items: Accounts) => void;

	const flipDurationMs = 200;

	function handleDndConsider({ detail }: CustomEvent<DndEvent<Account>>) {
		accounts = detail.items;
	}
	function handleDndFinalize({ detail }: CustomEvent<DndEvent<Account>>) {
		accounts = detail.items;
		onDrop(detail.items);
	}
</script>

<div
	class="flex flex-col w-full max-w-2xl gap-2"
	use:dragHandleZone={{
		items: accounts,
		flipDurationMs,
		dropTargetStyle: {}
	}}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each accounts as account (account.id)}
		<div
			animate:flip={{ duration: flipDurationMs }}
			class="flex gap-4 rounded-xl border bg-background p-4 max-w-80"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col">
					<span class="font-semibold">{account.name}</span>
					<span class="text-secondary-foreground">
						{account.description ?? '~'}
					</span>
				</div>

				<div class="mt-auto flex flex-col">
					<span class="text-lg font-bold tabular-nums leading-tight">
						{formatFractionToLocaleCurrency(account.working)}
					</span>
					<span class="text-sm text-secondary-foreground">Balance</span>
				</div>
			</div>

			<div class="ml-auto flex flex-col gap-2">
				<button
					class={buttonVariants({
						size: 'icon',
						variant: 'ghost',
						class: 'ml-auto'
					})}
					use:dragHandle
				>
					<LucideGripVertical />
					<span class="sr-only">Drag element to reorder</span>
				</button>

				<Button
					href="/accounts/{account.id}"
					variant="outline"
					size="sm"
					class="mt-auto">More Details</Button
				>
			</div>
		</div>
	{/each}
</div>
