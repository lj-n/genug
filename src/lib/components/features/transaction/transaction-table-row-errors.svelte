<script lang="ts">
	import type { RemoteFormIssue } from '@sveltejs/kit';

	let { issues }: { issues: RemoteFormIssue[] | undefined } = $props();
</script>

{#if issues?.length}
	<div role="cell" class="col-span-full bg-interactive/5 px-4 pb-2">
		<p role="alert" class="text-sm text-error">
			{issues.map((issue) => issue.message).join(' · ')}
		</p>
	</div>
{/if}
