<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
	<div class="flex max-w-md flex-col gap-3 rounded-lg bg-error/5 p-6 text-center">
		<p class="text-6xl font-bold tracking-tighter">
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
	</div>

	<a href={resolve('/(app)')} class="link text-sm">{m.error_page_go_home()}</a>
</div>
