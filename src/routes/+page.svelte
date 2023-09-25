<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	export let data: PageServerData;
</script>

<h1>Restricted Page</h1>
<pre>{JSON.stringify(data, null, 2)}</pre>

<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>
