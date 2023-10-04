<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Restricted Page</h1>
<pre>{JSON.stringify(data, null, 2)}</pre>
