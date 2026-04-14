<script lang="ts">
	import type { PageProps } from './$types';

	import CategoryDetail from './category-detail.svelte';

	let { data }: PageProps = $props();
</script>

<CategoryDetail category={data.category} />
