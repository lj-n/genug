<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="flex my-8">
	<a href="/transaction/create" class="ml-auto btn btn-primary"
		>create new transaction</a
	>
</div>

<div class="overflow-x-auto w-full">
	<table class="table table-zebra">
		<thead>
			<tr>
				<th>Date</th>
				<th>Account</th>
				<th>Category</th>
				<th>Description</th>
				<th>Flow</th>
				<th>Validated</th>
			</tr>
		</thead>
		<tbody>
			{#each data.transactions as transaction (transaction.id)}
				<tr>
					<th>{transaction.date}</th>
					<td>{transaction.account.name}</td>
					<td>{transaction.category?.name || 'To Be Assigned'}</td>
					<td>{transaction.description}</td>
					<td>{transaction.flow}</td>
					<td>{transaction.validated ? 'true' : 'false'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
