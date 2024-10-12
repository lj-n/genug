<script lang="ts">
	import type { PageData } from './$types';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import { Progress } from '$lib/components/ui/progress';
	import BudgetTableForm from './budget.table.form.svelte';
	import LucidePackage from '~icons/lucide/package';
	import LucidePackageOpen from '~icons/lucide/package-open';
	import LucidePackagePlus from '~icons/lucide/package-plus';
	import LucideFolder from '~icons/lucide/folder';
	import LucideSquareArrowOutUpRight from '~icons/lucide/square-arrow-out-up-right';

	import LucideGripVertical from '~icons/lucide/grip-vertical';
	import LucideGoal from '~icons/lucide/goal';

	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	export let budget: PageData['budget'];

	function handleSort({
		detail
	}: CustomEvent<DndEvent<PageData['budget'][number]>>) {
		budget = detail.items;
	}

	async function handleFinalize({
		detail
	}: CustomEvent<DndEvent<PageData['budget'][number]>>) {
		try {
			console.log(detail);
		} catch (err) {
			console.error(err);
		}
	}

	const flipDurationMs = 200;
</script>

<div class="flex flex-col rounded-lg border">
	<div
		class="grid grid-cols-[1fr_1fr_1fr_1fr_8rem] border-b py-2 text-sm font-medium text-muted-foreground"
	>
		<div class="flex items-center gap-1 px-2">
			<LucideFolder />
			Category
		</div>

		<div class="flex items-center justify-end gap-1 px-2">
			<LucidePackage />
			Budget
		</div>

		<div class="hidden items-center justify-end gap-1 px-2 md:flex">
			<LucidePackageOpen />
			Activity
		</div>

		<div class="flex items-center justify-end gap-1 px-2">
			<LucidePackagePlus />
			Rest
		</div>
	</div>

	<div
		class="flex flex-col"
		use:dragHandleZone={{
			items: budget,
			flipDurationMs,
			dropTargetStyle: {}
		}}
		on:consider={handleSort}
		on:finalize={handleFinalize}
	>
		{#each budget as row (row.id)}
			<div
				animate:flip={{ duration: flipDurationMs }}
				class="grid grid-cols-[1fr_1fr_1fr_1fr_8rem] border-b py-2 last:border-none"
			>
				<div class="flex flex-col self-center px-2">
					<span class="font-medium">{row.name}</span>

					{#if row.goal}
						<div
							class="flex items-center gap-2 text-sm text-blue dark:text-blue-light"
						>
							<Progress max={row.goal} value={row.rest} />

							<LucideGoal />

							<span class="whitespace-nowrap font-semibold tabular-nums">
								{formatFractionToLocaleCurrency(row.goal)}
							</span>
						</div>
					{/if}
				</div>

				<div class="self-center px-2 text-right">
					<BudgetTableForm {row} />
				</div>

				<div
					class="hidden self-center px-2 text-right font-semibold tabular-nums md:block"
				>
					{formatFractionToLocaleCurrency(row.activity)}
				</div>

				<div class="self-center px-2 text-right font-semibold tabular-nums">
					<span
						class={cn(
							row.rest < 0
								? 'text-orange dark:text-orange-light'
								: 'text-green dark:text-green-light'
						)}
					>
						{formatFractionToLocaleCurrency(row.rest)}
					</span>
				</div>

				<div class="flex w-full items-center justify-end gap-2 px-2">
					<button class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
						<LucideSquareArrowOutUpRight />
						<span class="sr-only">More Details</span>
					</button>

					<button
						class={buttonVariants({ variant: 'ghost', size: 'icon' })}
						use:dragHandle
					>
						<LucideGripVertical />
						<span class="sr-only">Reorder Category</span>
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
