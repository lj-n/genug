<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<pre>{JSON.stringify(data, null, 2)}</pre>

<form action="?/team" method="post">
	<button type="submit">Create Team</button>
</form>

<form action="?/account" method="post">
	<button type="submit">Create Account</button>
</form>
