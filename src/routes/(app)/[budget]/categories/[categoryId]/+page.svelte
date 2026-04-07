<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import PhHashDuotone from '~icons/ph/hash-duotone';

	import type { PageProps } from './$types';

	import CategoryArchive from './category-archive.svelte';
	import CategoryDelete from './category-delete.svelte';
	import CategoryEdit from './category-edit.svelte';
	import CategoryStats from './category-stats.svelte';

	let { data }: PageProps = $props();
	let category = $derived(data.category);
</script>

<div class="@container w-full max-w-4xl">
	<div class="grid gap-6 @3xl:grid-cols-2">
		<h1 class="flex items-center text-lg tracking-tighter text-muted @3xl:col-span-2">
			<PhHashDuotone />
			Category <span class="sr-only">{category.name}</span>
		</h1>

		<CategoryEdit form={data.editForm} />

		<Separator class="@3xl:hidden" />

		<CategoryStats {category} />

		<Separator class="@3xl:hidden" />

		<Separator class="col-span-2 hidden @3xl:block" orientation="horizontal" />

		<CategoryArchive {category} />

		<CategoryDelete {category} />
	</div>
</div>
