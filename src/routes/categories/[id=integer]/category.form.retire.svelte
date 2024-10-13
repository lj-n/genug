<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import {
		superForm,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import { retireFormSchema } from './schema';
	import { createToastFromFormMessage } from '$lib/utils';
	import { formatFractionToLocaleCurrency } from '$lib/components/utils';
	import type { PageData } from './$types';

	import LucideFolderSymlink from '~icons/lucide/folder-symlink';
	import LucideFolderArchive from '~icons/lucide/folder-archive';

	export let data: SuperValidated<Infer<typeof retireFormSchema>>;
	export let category: PageData['category'];
	export let stats: PageData['stats'];

	$: canBeRetired = stats.budgetSum + stats.transactionSum === 0;

	const form = superForm(data, {
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		}
	});

	const { enhance } = form;
</script>

<Card.Root class="grow">
	<Card.Header>
		{#if category.retired}
			<Card.Title>
				<span class="flex items-center">
					<LucideFolderSymlink class="mr-2" />
					Activate Category
				</span>
			</Card.Title>
			<Card.Description>
				This category is archived and is no longer displayed. You can activate
				it here.
			</Card.Description>
		{:else}
			<Card.Title>
				<span class="flex items-center">
					<LucideFolderArchive class="mr-2" />
					Archive Category
				</span>
			</Card.Title>
			<Card.Description>
				This will keep your statistics and records, but the category will no
				longer be displayed in your budgets, transactions, etc. You can always
				activate it later.
			</Card.Description>
		{/if}
	</Card.Header>

	<form action="?/retire" method="post" use:enhance>
		<Card.Content>
			<input type="hidden" name="retired" value={!category.retired} />
			{#if !canBeRetired}
				<div class="text-sm text-destructive">
					<span class="font-semibold"> Currently available funds </span>
					have to equal
					<span class="font-semibold tabular-nums">
						{formatFractionToLocaleCurrency(0)}
					</span>
					to archive this category.
				</div>
			{/if}
		</Card.Content>

		<Card.Footer class="flex justify-end">
			{#if category.retired}
				<Form.Button>Activate Category</Form.Button>
			{:else if canBeRetired}
				<Form.Button>Archive Category</Form.Button>
			{/if}
		</Card.Footer>
	</form>
</Card.Root>
