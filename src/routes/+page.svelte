<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1 class="my-8">👋 Hi there {data.user?.name}!</h1>
