<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import PhHashDuotone from '~icons/ph/hash-duotone';

	import CategoryArchive from './category-archive.svelte';
	import CategoryDelete from './category-delete.svelte';
	import CategoryEdit from './category-edit.svelte';
	import CategoryStats from './category-stats.svelte';

	let { categoryId }: { categoryId: string } = $props();
</script>

<div class="@container w-full">
	<div class="grid gap-6 @3xl:grid-cols-2">
		<h1 class="flex items-center gap-2 tracking-tighter italic @3xl:col-span-2">
			<span class="text-xl font-semibold">{m.category_detail_title()}</span>

			<span
				class="flex items-center gap-0.5 rounded-md bg-info/10 px-1 font-mono text-sm text-info"
			>
				<PhHashDuotone />
				{categoryId}
			</span>
		</h1>

		<Separator class="@3xl:col-span-2" />

		<CategoryEdit {categoryId} />

		<Separator class="@3xl:hidden" />

		<CategoryStats {categoryId} />

		<Separator class="@3xl:hidden" />

		<Separator class="col-span-2 hidden @3xl:block" orientation="horizontal" />

		<CategoryArchive {categoryId} />

		<CategoryDelete {categoryId} />
	</div>
</div>
