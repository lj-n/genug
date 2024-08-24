<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import * as Form from '$lib/components/ui/form';

	import ShallowRouteModal from '$lib/components/navigation/shallow.route.modal.svelte';
	import CreateTransactionPage from './create/+page.svelte';
	import type { PageData as CreateTransactionPageData } from './create/$types';

	import LucideTimer from '~icons/lucide/timer';
	import LucideFileCheck from '~icons/lucide/file-check';
	import LucideTrash2 from '~icons/lucide/trash-2';
	import {
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import type { validateFormSchema } from './schema';
	import { createToastFromFormMessage } from '$lib/utils';

	import LucideFilePlus2 from '~icons/lucide/file-plus-2';
	import { buttonVariants } from '$lib/components/ui/button';
	import { createShallowRoute } from '$lib/shallow.routing';
	import { page } from '$app/stores';

	export let selectedTransactions: PageData['transactions'];
	export let validateForm: SuperValidated<Infer<typeof validateFormSchema>>;

	const form = superForm(validateForm, {
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		}
	});

	const { enhance } = form;

	const [action, data, isOpen] =
		createShallowRoute<CreateTransactionPageData>();
</script>

<div class="my-4 flex">
	{#if selectedTransactions.length > 0}
		<div class="flex items-center gap-4">
			<Badge variant="ghost" class="h-fit">
				Selected: {selectedTransactions.length}
			</Badge>

			<form method="post" use:enhance>
				{#each selectedTransactions as transaction}
					<input type="hidden" name="transactionIds" value={transaction.id} />
				{/each}

				<Form.Button size="icon" variant="ghost">
					<LucideFileCheck class="text-green dark:text-green-light" />
					<span class="sr-only"> Validate Selected Transactions </span>
				</Form.Button>

				<Form.Button size="icon" variant="ghost" name="invalidate">
					<LucideTimer class="text-blue dark:text-blue-light" />
					<span class="sr-only"> Set Selected Transactions as Pending </span>
				</Form.Button>

				<Form.Button
					size="icon"
					variant="ghost"
					name="delete"
					on:click={(e) =>
						!confirm(
							`This will delete ${selectedTransactions.length} transactions. Are you sure?`
						) && e.preventDefault()}
				>
					<LucideTrash2 class="text-red dark:text-red-light" />
					<span class="sr-only"> Delete Selected Transactions </span>
				</Form.Button>
			</form>
		</div>
	{/if}

	<div class="ml-auto">
		<a
			href="/transactions/create"
			use:action={$page.url}
			class={buttonVariants()}
		>
			<LucideFilePlus2 class="mr-2" />
			Create Transaction
		</a>
	</div>
</div>

<ShallowRouteModal open={$isOpen} close={() => history.back()}>
	{#if $data}
		<CreateTransactionPage data={$data} />
	{/if}
</ShallowRouteModal>
