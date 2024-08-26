<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import { createToastFromFormMessage } from '$lib/utils';
	import LucideFolderArchive from '~icons/lucide/folder-archive';

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
		{#each data.categories as { id, name, description } (id)}
			<li
				class="group flex flex-wrap items-center justify-between gap-2 py-4 first:pt-0 last:pb-0"
			>
				<div class="overflow-hidden">
					<p class="text-sm font-medium text-slate-900">{name}</p>
					<p class="truncate text-sm text-slate-500">{description ?? ''}</p>
				</div>
				<div
					class="flex gap-2 opacity-100 transition-opacity focus-within:opacity-100 group-hover:opacity-100 md:opacity-20"
				>
					<Form.Button
						variant="outline"
						size="sm"
						value={id}
						name="categoryId"
						formaction="?/unretire"
					>
						Unarchive
					</Form.Button>
					<Form.Button
						variant="destructive"
						size="sm"
						value={id}
						name="categoryId"
						formaction="?/remove"
					>
						Delete
					</Form.Button>
				</div>
			</li>
		{/each}
	</ul>
</form>
