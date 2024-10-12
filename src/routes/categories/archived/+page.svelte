<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { createToastFromFormMessage } from '$lib/utils';
	import LucideFolderArchive from '~icons/lucide/folder-archive';
	import LucideTrash2 from '~icons/lucide/trash-2';

	import * as Form from '$lib/components/ui/form';

	export let data: PageData;

	const form = superForm(data.form, {
		onUpdated(event) {
			if (event.form.message) {
				createToastFromFormMessage(event.form.message);
			}
		}
	});

	const { enhance } = form;
</script>

<div class="mb-6 space-y-4">
	<h2
		class="flex items-center text-lg font-semibold leading-none tracking-tight"
	>
		<LucideFolderArchive class="mr-2" />
		Archived Categories
	</h2>

	<p class="text-muted-foreground">
		These categories are archived and are no longer displayed. You can unarchive
		or delete them here.
	</p>
</div>

<form class="flex flex-col gap-2" method="post" use:enhance>
	<ul role="list" class="divide-y divide-border">
		{#each data.categories as category (category.id)}
			<li class="group">
				<div
					class="flex border-t border-secondary bg-background p-1 first:border-none"
				>
					<div class="flex flex-col">
						<span class="font-semibold">{category.name}</span>
						<span class="text-secondary-foreground">
							{category.description ?? '~'}
						</span>
					</div>

					<div class="ml-auto flex items-center gap-4">
						<Form.Button
							variant="outline"
							size="sm"
							value={category.id}
							name="categoryId"
							formaction="?/unretire"
						>
							Unarchive
						</Form.Button>
						<Form.Button
							size="icon"
							variant="ghost"
							name="delete"
							on:click={(e) => !confirm(`Are you sure?`) && e.preventDefault()}
						>
							<LucideTrash2 class="text-red dark:text-red-light" />
							<span class="sr-only"> Delete Selected Category </span>
						</Form.Button>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</form>
