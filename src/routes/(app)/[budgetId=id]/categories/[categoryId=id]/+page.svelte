<script lang="ts">
	import type { PageProps } from './$types';

	import CategoryDetail from './category-detail.svelte';

	let { params }: PageProps = $props();
</script>

<CategoryDetail categoryId={params.categoryId} />
