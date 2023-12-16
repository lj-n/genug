<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { onMount } from 'svelte';
	import { Chart } from 'chart.js/auto';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import {
		currencyInputProps,
		formatFractionToLocaleCurrency,
		withLoading
	} from '$lib/components/utils';
	import Feather from '$lib/components/feather.svelte';
	import { writable } from 'svelte/store';

	export let data: PageData;
	export let form: ActionData;

	const formattedDate = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(new Date(data.category.createdAt));

	let updateLoading = writable(false);
	let retireLoading = writable(false);
	let moveTransactionLoading = writable(false);
	let removeCategoryLoading = writable(false);
	let moveTransactionInput = '';
	let removeCategoryInput = '';

	$: moveTransactionReady = moveTransactionInput === data.category.name;
	$: removeCategoryReady = removeCategoryInput === data.category.name;

	$: canBeRetired = data.budgetSum + data.transactions.sum === 0;

	let canvas: HTMLCanvasElement;

	onMount(() => {
		false;
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
						backgroundColor: '#4385be',
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

<span class="mt-8 text-muted text-xs w-fit mx-auto">
	Created at {formattedDate}
</span>
<h1 class="font-bold text-3xl mx-auto">{data.category.name}</h1>
<span class="text-xl text-muted mb-8 mx-auto"
	>{data.category.description || ''}
</span>

<div class="flex flex-wrap gap-8 my-8 items-center justify-center">
	<div class="relative h-60 w-200 max-w-full">
		<canvas
			aria-label="Sum of transactions in the last 12 months"
			bind:this={canvas}
		/>
	</div>

	<div class="flex flex-col gap-2">
		<div class="flex flex-col">
			<span class="tabular-nums text-xl font-bold">
				{data.transactions.count}
			</span>
			<span>Related Transactions</span>
		</div>
		<div class="flex flex-col">
			<span class="tabular-nums text-xl font-bold">
				{formatFractionToLocaleCurrency(data.transactions.sum)}
			</span>
			<span>Total Flow</span>
		</div>
		<div class="flex flex-col">
			<span class="tabular-nums text-xl font-bold">
				{formatFractionToLocaleCurrency(data.budgetSum)}
			</span>
			<span>Total Budget</span>
		</div>
	</div>
</div>

<div class="flex flex-col gap-20 mt-8 max-w-prose mx-auto">
	<form
		action="?/updateCategory"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(updateLoading)}
	>
		<h2 class="text-xl font-semibold">Update Category Details</h2>

		<label class="input-label">
			Name
			<input
				type="text"
				name="name"
				class="input"
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
			/>
		</label>

		<label class="input-label">
			Set a goal in this category (0 to remove goal)
			<input
				type="text"
				name="goal"
				class="input"
				placeholder="0"
				value={data.category.goal || 0}
				title={currencyInputProps.title}
				pattern={currencyInputProps.pattern}
			/>
		</label>

		<Button
			type="submit"
			class="btn btn-blue ml-auto"
			icon="chevrons-right"
			loading={$updateLoading}
		>
			Update Category
		</Button>
	</form>

	<form
		action="?/retireCategory"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(retireLoading)}
	>
		<input type="hidden" name="retired" value={!data.category.retired} />

		{#if !data.category.retired}
			<h2 class="text-xl font-semibold">Retire this Category</h2>

			<p class="text-normal">
				Have you reached your goal? Do you no longer need this category? Instead
				of deleting it, you can retire it. You will keep your statistics and
				records, but the category will no longer be displayed in your budgets,
				transactions, etc..
			</p>

			{#if canBeRetired}
				<span class="info info-blue flex gap-2 items-center mx-auto">
					<Feather name="info" />
					Don't worry, you can always revert this decision.
				</span>
			{:else}
				<span class="info info-red flex gap-2 items-center mx-auto">
					<Feather name="alert-circle" />
					You have to even out the budgeted sum and the sum of transactions to retire
					this category. (Check the category details)
				</span>
			{/if}

			<Button
				type="submit"
				icon="sunset"
				class="btn btn-blue ml-auto"
				loading={$retireLoading}
				disabled={!canBeRetired}
			>
				Retire Category
			</Button>
		{:else}
			<h2 class="text-xl">Unretire this Category</h2>

			<p>
				This category is currently retired and will not be displayed in your
				budget overview. If you want to use this category again, click the
				button below.
			</p>

			<Button icon="sunrise" class="btn btn-blue ml-auto" type="submit">
				Unretire Category
			</Button>
		{/if}
	</form>

	<form
		action="?/moveTransactions"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(moveTransactionLoading)}
	>
		<h2 class="text-xl font-semibold">Move Transactions to Another Category</h2>

		<p>
			Move all transaction related to this category to another existing
			category.
		</p>

		<span class="info info-red flex gap-2 items-center mx-auto">
			<Feather name="alert-circle" />
			This action can not be undone!
		</span>

		<label class="input-label">
			Select another category
			<select name="newCategoryId" class="input" required>
				<option selected disabled>Select Category Here</option>
				{#each data.otherCategories as category (category.id)}
					<option value={category.id}>{category.name}</option>
				{/each}
			</select>
		</label>

		<label class="input-label">
			<span>
				Please type <b>{data.category.name}</b> to confirm:
			</span>
			<input
				bind:value={moveTransactionInput}
				type="text"
				name="categoryName"
				class="input w-full"
				required
			/>
		</label>

		{#if form?.moveTransactionError}
			<p class="text-error text-center">{form.moveTransactionError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto"
			icon="chevrons-right"
			loading={$moveTransactionLoading}
			disabled={!moveTransactionReady}
		>
			Move Transactions
		</Button>
	</form>

	<form
		action="?/removeCategory"
		method="post"
		class="flex flex-col gap-4"
		use:enhance={withLoading(removeCategoryLoading)}
	>
		<h2 class="text-xl font-semibold">Delete Category</h2>

		<p>Delete this category and all its related transactions.</p>

		<span class="info info-red flex gap-2 items-center mx-auto">
			<Feather name="alert-circle" />
			This action can not be undone!
		</span>

		<label class="input-label">
			<span>
				Please type <b>{data.category.name}</b> to confirm:
			</span>
			<input
				bind:value={removeCategoryInput}
				type="text"
				name="categoryName"
				class="input w-full"
				aria-labelledby="warning-label"
			/>
		</label>

		{#if form?.removeCategoryError}
			<p class="text-error text-center">{form.removeCategoryError}</p>
		{/if}

		<Button
			class="btn btn-red ml-auto"
			icon="trash"
			loading={$removeCategoryLoading}
			disabled={!removeCategoryReady}
		>
			Delete Category
		</Button>
	</form>
</div>
