<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="overflow-x-auto w-full">
	<table class="table table-zebra">
		<thead>
			<tr>
				<th>Category</th>
				<th>Budget</th>
				<th>Activity</th>
				<th>Rest</th>
			</tr>
		</thead>
		<tbody>
			{#each data.budgets as budget (budget.category.id)}
				<tr>
					<th>{budget.category.name}</th>
					<th>{budget.budget}</th>
					<th>{budget.activity}</th>
					<th>{budget.rest}</th>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
