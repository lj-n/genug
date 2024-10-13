<script lang="ts">
	import type { PageData } from './$types';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import { Progress } from '$lib/components/ui/progress';
	import BudgetTableForm from './budget.table.form.svelte';
	import LucidePackage from '~icons/lucide/package';
	import LucidePackageOpen from '~icons/lucide/package-open';
	import LucidePackagePlus from '~icons/lucide/package-plus';
	import LucideFolder from '~icons/lucide/folder';

	import LucideGripVertical from '~icons/lucide/grip-vertical';
	import LucideGoal from '~icons/lucide/goal';

	import { cn } from '$lib/utils';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { invalidateAll } from '$app/navigation';
	import { removeThenAppendNewSortedIdsToArray } from '$lib/components/sort.utils';

	export let budget: PageData['budget'];
	export let currentOrder: number[];

	function handleSort({
		detail
	}: CustomEvent<DndEvent<PageData['budget'][number]>>) {
		budget = detail.items;
	}

	async function handleFinalize({
		detail
	}: CustomEvent<DndEvent<PageData['budget'][number]>>) {
		try {
			budget = detail.items;

			const order = removeThenAppendNewSortedIdsToArray(
				currentOrder,
				detail.items.map((c) => c.id)
			);

			await fetch('/categories?/saveOrder', {
				method: 'POST',
				body: JSON.stringify({ order }),
				headers: { 'x-sveltekit-action': 'true' }
			});

			invalidateAll();
		} catch (err) {
			console.error(err);
		}
	}

	const flipDurationMs = 200;
</script>

<div class="flex flex-col rounded-lg border">
	<div
		class="grid grid-cols-[1fr_1fr_1fr_1fr_3.25rem] border-b py-2 text-sm font-medium text-muted-foreground"
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
			dropTargetStyle: {},
			dropTargetClasses: [
				'outline-dashed',
				'outline-2',
				'outline-yellow',
				'dark:outline-yellow-light',
				'rounded'
			],
			transformDraggedElement(el) {
				const children = el?.querySelectorAll('[data-hide-while-dragging]');
				children?.forEach((child) => {
					child.classList.add('opacity-0');
				});

				const wrapper = el?.querySelector('[data-dragging-wrapper]');
				wrapper?.classList.add(
					'bg-background',
					'hover:bg-muted',
					'outline-dashed',
					'outline-2',
					'outline-yellow',
					'dark:outline-yellow-light',
					'rounded',
					'origin-right',
					'-rotate-1',
					'shadow-lg'
				);

				el?.classList.add('outline-none');
			}
		}}
		on:consider={handleSort}
		on:finalize={handleFinalize}
	>
		{#each budget as row (row.id)}
			<div animate:flip={{ duration: flipDurationMs }} class="group">
				<div
					class="border-b py-2 hover:bg-muted/50 group-last:rounded-b-lg group-last:border-none"
					data-dragging-wrapper
				>
					<div class="grid grid-cols-[1fr_1fr_1fr_1fr_3.25rem]">
						<div class="flex flex-col self-center px-2">
							<a href="/categories/{row.id}" class="hover:underline">
								<span class="font-medium">{row.name}</span>
							</a>

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

						<div class="self-center px-2 text-right" data-hide-while-dragging>
							<BudgetTableForm {row} />
						</div>

						<div
							class="hidden self-center px-2 text-right font-semibold tabular-nums md:block"
							data-hide-while-dragging
						>
							{formatFractionToLocaleCurrency(row.activity)}
						</div>

						<div
							class="self-center px-2 text-right font-semibold tabular-nums"
							data-hide-while-dragging
						>
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

						<div class="flex w-full items-center justify-end gap-0.5 px-2">
							<button
								class="text-muted-foreground hover:text-yellow dark:hover:text-yellow-light"
								use:dragHandle
							>
								<LucideGripVertical />
								<span class="sr-only">Reorder Category</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
