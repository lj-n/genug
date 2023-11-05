<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/button.svelte';
	import Currency from '$lib/components/currency.svelte';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { PageData } from './$types';
	export let data: PageData;

	let updateLoading = false;
	let moveTransactionLoading = false;
	let moveTransactionInput = '';
	let removeCategoryLoading = false;
	let removeCategoryInput = '';

	$: moveTransactionReady = moveTransactionInput === data.category.name;
	$: removeCategoryReady = removeCategoryInput === data.category.name;
</script>

<div class="card md:col-span-3">
	<h1 id="category-{data.category.id}" class="scroll-m-16">
		{data.category.name}
	</h1>
	<p class="mb-8">Description: {data.category.description || '~'}</p>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div
			class="lg:col-span-2 grid grid-cols-2 gap-2 rounded-md border border-neutral-200 p-4"
		>
			<h2 class="col-span-2">Details</h2>

			{#if data.category.goal}
				<span>Goal</span>
				<span class="font-semibold tabular-nums text-right">
					{formatFractionToLocaleCurrency(data.category.goal)}
				</span>
			{/if}

			<span>Created at</span>
			<span class="font-semibold text-right">
				{data.category.createdAt}
			</span>

			<span>Related Transactions Count</span>
			<span class="font-semibold tabular-nums text-right">
				{data.category.transactionCount}
			</span>

			<span>Related Transactions Sum</span>
			<span class="font-semibold tabular-nums text-right">
				{formatFractionToLocaleCurrency(data.category.transactionSum)}
			</span>

			<span>Related Budget Sum</span>
			<span class="font-semibold tabular-nums text-right">
				{formatFractionToLocaleCurrency(data.category.budgetSum)}
			</span>
		</div>

		<form
			action="?/updateCategory"
			method="post"
			class="flex flex-col gap-4 rounded-md border border-neutral-200 p-4"
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
				<input type="text" name="name" class="input" disabled={updateLoading} />
			</label>

			<label class="input-label">
				Description
				<input
					type="text"
					name="description"
					class="input"
					disabled={updateLoading}
				/>
			</label>

			<Currency
				name="goal"
				class="input-label"
				disabled={updateLoading}
				value={data.category.goal || 0}
			>
				Set a goal in this category (0 to remove goal)
			</Currency>

			<Button
				class="btn btn-secondary mt-auto"
				icon="chevrons-right"
				loading={updateLoading}
			>
				Update Category
			</Button>
		</form>

		<form
			action="?/retireCategory"
			method="post"
			class="flex flex-col gap-2 rounded-md border border-neutral-200 p-4"
		>
			<input type="hidden" name="retired" value={!data.category.retired} />
			{#if !data.category.retired}
				<h2>Retire this Category</h2>

				<p>
					Have you reached your goal? Do you no longer need this category?
					Instead of deleting it, you can retire it. You will keep your
					statistics and records, but the category will no longer be displayed
					in your budgets, transactions, etc..
				</p>

				<blockquote>
					Don't worry, you can always revert this decision.
				</blockquote>

				<Button icon="sunset" class="btn btn-secondary mt-auto">
					Retire Category
				</Button>
			{:else}
				<h2>Unretire this Category</h2>

				<p>
					This category is currently retired. If you want to use it again
					unretire it:
				</p>

				<Button icon="sunrise" class="btn btn-secondary mt-auto">
					Unretire Category
				</Button>
			{/if}
		</form>
	</div>

	<h2 class="mt-8 text-center text-red-500">Danger Zone ⚡</h2>
	<p class="mb-4 text-center text-red-500 font-bold">
		Warning: These actions can not be undone!
	</p>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<form
			action="?/moveTransactions"
			method="post"
			class="flex flex-col gap-4 p-4 border-2 border-red-500 border-dashed rounded-md bg-red-50"
			use:enhance={() => {
				moveTransactionLoading = true;
				return async ({ update }) => {
					moveTransactionLoading = false;
					update();
				};
			}}
		>
			<h3>Move Transactions to Another Category</h3>

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

			<Button
				class="btn btn-danger ml-auto mt-2"
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
			class="flex flex-col gap-4 p-4 border-2 border-red-500 border-dashed rounded-md bg-red-50"
			use:enhance={() => {
				removeCategoryLoading = true;
				return async ({ update }) => {
					removeCategoryLoading = false;
					update();
				};
			}}
		>
			<h3>Delete Category</h3>

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

			<Button
				class="btn btn-danger ml-auto mt-auto"
				icon="trash"
				loading={removeCategoryLoading}
				disabled={!removeCategoryReady}
			>
				Delete Category
			</Button>
		</form>
	</div>
</div>
