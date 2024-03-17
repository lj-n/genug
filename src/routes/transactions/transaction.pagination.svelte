<script lang="ts">
	import { page } from '$app/stores';
	import Feather from '$lib/components/feather.svelte';

	$: currentPage = Number($page.url.searchParams.get('page') || '1');

	function getPrevPageHref() {
		const searchParams = new URLSearchParams($page.url.searchParams);
		if (currentPage === 1) {
			return '/transactions?' + searchParams.toString();
		}

		searchParams.set('page', (currentPage - 1).toString());
		return '/transactions?' + searchParams.toString();
	}

	function getNextPageHref() {
		const searchParams = new URLSearchParams($page.url.searchParams);
		searchParams.set('page', (currentPage + 1).toString());
		return '/transactions?' + searchParams.toString();
	}
</script>

{#key $page.url}
	<div class="flex my-4 gap-2 items-center ml-auto">
		<a href={getPrevPageHref()} class="btn btn-ghost btn-sm" data-sveltekit-keepfocus>
			<Feather name="arrow-left" />
		</a>

		<span class="text-tx-2">
			Page: {currentPage}
		</span>

		<a href={getNextPageHref()} class="btn btn-ghost btn-sm" data-sveltekit-keepfocus>
			<Feather name="arrow-right" />
		</a>
	</div>
{/key}
