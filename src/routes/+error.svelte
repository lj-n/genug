<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
	<p class="font-display text-8xl font-bold">
		{page.status}
	</p>
	<p class="font-medium text-error">
		{page.error?.message ?? m.error_page_unexpected()}
	</p>
	{#if page.error?.logId}
		<p class="text-sm text-muted">
			{m.error_page_log_id()} <span class="font-mono">{page.error.logId}</span>
		</p>
	{/if}
	<a href={resolve('/(app)')} class="link mt-4 text-sm">{m.error_page_go_home()}</a>
</div>
