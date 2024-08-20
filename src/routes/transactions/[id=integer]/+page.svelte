<script lang="ts">
	import type { PageData } from './$types';

	import CreateTransactionForm from '../transactions.form.svelte';
	import LucideSave from '~icons/lucide/save';

	export let data: PageData;
</script>

<CreateTransactionForm {data}>
	<h1
		slot="header"
		class="mx-auto mb-6 text-xl font-semibold leading-none tracking-tight"
	>
		Edit Transaction
	</h1>

	<LucideSave class="mr-2" slot="submit_icon" />
	<span slot="submit_text">Save</span>
</CreateTransactionForm>
