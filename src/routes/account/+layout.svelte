<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<main>
	<h1 class="font-bold text-5xl">Accounts</h1>
	<p class="text-neutral-content">Create, update or delete accounts.</p>

	<slot />
</main>
