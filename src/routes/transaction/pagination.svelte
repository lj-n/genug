<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	export let page: number;
</script>

<div class="flex my-2 gap-2 items-center ml-auto">
	<a
		href="/transaction?page={Math.max(page - 1, 1)}"
		class="btn btn-ghost btn-sm"
	>
		<Feather name="arrow-left" />
	</a>

	<span class="text-tx-2">Page: {page}</span>

	<a
		href="/transaction?page={page + 1}"
		class="btn btn-ghost btn-sm"
	>
		<Feather name="arrow-right" />
	</a>
</div>
