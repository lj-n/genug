<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { onMount } from 'svelte';
	import { Chart } from 'chart.js/auto';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency
	} from '$lib/components/utils';

	export let data: PageData;
	export let form: ActionData;

	let updateLoading = false;
	let retireLoading = false;
	let moveTransactionLoading = false;
	let removeCategoryLoading = false;
	let moveTransactionInput = '';
	let removeCategoryInput = '';

	$: moveTransactionReady = moveTransactionInput === data.category.name;
	$: removeCategoryReady = removeCategoryInput === data.category.name;

	$: canBeRetired =
		data.budgetSum + data.transactions.sum === 0;

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const chart = new Chart(canvas, {
			type: 'bar',
			options: {
				scales: {
					yAxis: {
						reverse: true,
						ticks: {
							callback(tickValue) {
								return formatFractionToLocaleCurrency(Number(tickValue));
							}
						}
					}
				},
				maintainAspectRatio: false,
				events: [],
				plugins: {
					tooltip: {
						enabled: false
					}
				}
			},
			data: {
				labels: data.lastMonthsStats.map(({ date }) => date),
				datasets: [
					{
						label: 'Transaction Sum',
						data: data.lastMonthsStats.map(({ sum }) => sum),
						backgroundColor: '#4385BE',
						borderRadius: 2,
						yAxisID: 'yAxis'
					}
				]
			}
		});

		return () => {
			chart.destroy();
		};
	});
</script>

<h1 id="category-{data.category.id}" class="scroll-mt-20 md:scroll-mt-80">
	{data.category.name}
</h1>
<span class="text-sm text-tx-2 mt-2">Created: {data.category.createdAt}</span>
<p class="mb-8 mt-4 text-lg text-tx-2">{data.category.description || ''}</p>

<div class="grid grid-cols-3 gap-4 divide-x divide-ui-3">
	<div class="px-4 lg:px-8 flex flex-col">
		<span class="font-semibold text-3xl lg:text-5xl"
			>{data.transactions.count}</span
		>
		<span class="text-tx-2">Related Transactions</span>
	</div>

	<div class="px-4 lg:px-8 flex flex-col">
		<span class="font-semibold text-3xl lg:text-5xl tabular-nums">
			{formatFractionToLocaleCurrency(data.transactions.sum)}
		</span>
		<span class="text-tx-2">Total Flow</span>
	</div>

	<div class="px-4 lg:px-8 flex flex-col">
		<span class="font-semibold text-3xl lg:text-5xl tabular-nums">
			{formatFractionToLocaleCurrency(data.budgetSum)}
		</span>
		<span class="text-tx-2">Total Budget</span>
	</div>
</div>

<div class="relative w-full h-60 my-12">
	<canvas
		aria-label="Sum of transactions in the last 12 months"
		bind:this={canvas}
	/>
</div>

<div
	class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-x lg:divide-y-0 divide-ui-3"
>
	<form
		action="?/updateCategory"
		method="post"
		class="flex flex-col gap-4 p-4 lg:p-8"
		use:enhance={() => {
			updateLoading = true;
			return async ({ update }) => {
				updateLoading = false;
				update();
			};
		}}
	>
		<h2>Update Category</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				class="input"
				disabled={updateLoading}
				placeholder="New Category Name"
			/>
		</label>

		<label class="input-label">
			Description
			<input
				type="text"
				name="description"
				class="input"
				placeholder="New Category Description"
				disabled={updateLoading}
			/>
		</label>

		<label class="input-label">
			Set a goal in this category (0 to remove goal)
			<input
				type="text"
				name="goal"
				class="input"
				placeholder="0"
				disabled={updateLoading}
				value={data.category.goal || 0}
				title={currencyInputProps.title}
				pattern={currencyInputProps.pattern}
			/>
		</label>

		<Button
			type="submit"
			class="btn btn-blue mt-auto"
			icon="chevrons-right"
			loading={updateLoading}
		>
			Update Category
		</Button>
	</form>

	<form
		action="?/retireCategory"
		method="post"
		class="flex flex-col gap-4 p-4 lg:p-8"
		use:enhance={() => {
			retireLoading = true;
			return async ({ update }) => {
				retireLoading = false;
				update();
			};
		}}
	>
		<input type="hidden" name="retired" value={!data.category.retired} />
		{#if !data.category.retired}
			<h2>Retire this Category</h2>

			<p>
				Have you reached your goal? Do you no longer need this category? Instead
				of deleting it, you can retire it. You will keep your statistics and
				records, but the category will no longer be displayed in your budgets,
				transactions, etc..
			</p>

			{#if canBeRetired}
				<blockquote>
					Don't worry, you can always revert this decision.
				</blockquote>
			{:else}
				<blockquote>
					You have to even out the budgeted sum and the sum of transactions to
					retire this category. (Check the category details)
				</blockquote>
			{/if}

			<Button
				type="submit"
				icon="sunset"
				class="btn btn-blue mt-auto"
				loading={retireLoading}
				disabled={!canBeRetired}
			>
				Retire Category
			</Button>
		{:else}
			<h2>Unretire this Category</h2>

			<p>If you want to use this category again, click the button below.</p>

			<Button icon="sunrise" class="btn btn-blue mt-auto" type="submit">
				Unretire Category
			</Button>
		{/if}
	</form>
</div>

<h2 class="mt-4 text-center text-red-light">Danger Zone</h2>
<p class="mb-4 text-center text-red-light font-bold">
	Warning: These actions can not be undone!
</p>

<div
	class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-x lg:divide-y-0 divide-ui-3"
>
	<form
		action="?/moveTransactions"
		method="post"
		class="flex flex-col gap-4 p-4 lg:p-8"
		use:enhance={() => {
			moveTransactionLoading = true;
			return async ({ update }) => {
				moveTransactionLoading = false;
				update();
			};
		}}
	>
		<h3 class="text-red-light">Move Transactions to Another Category</h3>

		<label class="input-label">
			Select another Category
			<select name="newCategoryId" class="input" required>
				<option selected disabled>Select Category Here</option>
				{#each data.otherCategories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<p id="warning-label">
			Please type <b>{data.category.name}</b> to confirm:
		</p>

		<input
			bind:value={moveTransactionInput}
			type="text"
			name="categoryName"
			class="input w-full"
			aria-labelledby="warning-label"
			required
		/>

		{#if form?.moveTransactionError}
			<p class="text-red-500 my-2">{form.moveTransactionError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto mt-2"
			icon="chevrons-right"
			loading={moveTransactionLoading}
			disabled={!moveTransactionReady}
		>
			Move Transactions
		</Button>
	</form>

	<form
		action="?/removeCategory"
		method="post"
		class="flex flex-col gap-4 p-4 lg:p-8"
		use:enhance={() => {
			removeCategoryLoading = true;
			return async ({ update }) => {
				removeCategoryLoading = false;
				update();
			};
		}}
	>
		<h3 class="text-red-light">Delete Category</h3>

		<p>
			Please type <b>{data.category.name}</b> to confirm:
		</p>

		<input
			bind:value={removeCategoryInput}
			type="text"
			name="categoryName"
			class="input w-full"
			aria-labelledby="warning-label"
		/>

		{#if form?.removeCategoryError}
			<p class="text-red-500 my-2">{form.removeCategoryError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto mt-auto"
			icon="trash"
			loading={removeCategoryLoading}
			disabled={!removeCategoryReady}
		>
			Delete Category
		</Button>
	</form>
</div>
